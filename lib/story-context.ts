import { createHash, randomUUID } from 'crypto';
import { prisma } from './prisma';
import { embed } from './embedding';
import { upsertVector, searchStoryContext, STORY_CONTEXT_COLLECTION } from './qdrant';
import { extractPlainText } from './tiptap-utils';
import { llmComplete } from './llm-client';

// ── Configuration ──

const STORY_CONTEXT_TIMEOUT_MS = Number(process.env.STORY_CONTEXT_TIMEOUT_MS) || 600000; // 10 minutes
const MAX_SECTION_TEXT_LENGTH = 20000;
const MIN_SECTION_TEXT_LENGTH = 50;

// ── Types ──

export interface StoryContextExtraction {
  is_narrative: boolean;
  summary: string;
  characters: Array<{
    name: string;
    description: string;
    traits: string[];
    relationships: string[];
  }>;
  plot_events: string[];
  settings: Array<{
    name: string;
    description: string;
  }>;
  timeline_details: string[];
  themes: string[];
  important_objects: string[];
  conflicts: string[];
  foreshadowing: string[];
}

export interface BookQueryResponse {
  answer: string;
  evidence: Array<{
    sectionId: number;
    chapterTitle: string;
    sectionTitle: string | null;
    excerpt: string;
  }>;
  gaps: string[];
  suggestions: string[];
  confidence: 'high' | 'medium' | 'low';
  mode: 'book';
}

export interface ClassificationResult {
  mode: 'book' | 'general';
  confidence: number;
}

// ── JSON Schemas ──

const EXTRACTION_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    is_narrative: { type: 'boolean' as const },
    summary: { type: 'string' as const },
    characters: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          description: { type: 'string' as const },
          traits: { type: 'array' as const, items: { type: 'string' as const } },
          relationships: { type: 'array' as const, items: { type: 'string' as const } },
        },
        required: ['name', 'description', 'traits', 'relationships'],
        additionalProperties: false,
      },
    },
    plot_events: { type: 'array' as const, items: { type: 'string' as const } },
    settings: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          description: { type: 'string' as const },
        },
        required: ['name', 'description'],
        additionalProperties: false,
      },
    },
    timeline_details: { type: 'array' as const, items: { type: 'string' as const } },
    themes: { type: 'array' as const, items: { type: 'string' as const } },
    important_objects: { type: 'array' as const, items: { type: 'string' as const } },
    conflicts: { type: 'array' as const, items: { type: 'string' as const } },
    foreshadowing: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: [
    'is_narrative', 'summary', 'characters', 'plot_events', 'settings',
    'timeline_details', 'themes', 'important_objects', 'conflicts', 'foreshadowing',
  ],
  additionalProperties: false,
};

const CLASSIFICATION_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    mode: { type: 'string' as const, enum: ['book', 'general'] },
    confidence: { type: 'number' as const },
  },
  required: ['mode', 'confidence'],
  additionalProperties: false,
};

const QUERY_PLAN_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    sub_queries: { type: 'array' as const, items: { type: 'string' as const } },
  },
  required: ['sub_queries'],
  additionalProperties: false,
};

const BOOK_ANSWER_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    answer: { type: 'string' as const },
    evidence: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          sectionId: { type: 'number' as const },
          chapterTitle: { type: 'string' as const },
          sectionTitle: { type: ['string', 'null'] as const },
          excerpt: { type: 'string' as const },
        },
        required: ['sectionId', 'chapterTitle', 'sectionTitle', 'excerpt'],
        additionalProperties: false,
      },
    },
    gaps: { type: 'array' as const, items: { type: 'string' as const } },
    suggestions: { type: 'array' as const, items: { type: 'string' as const } },
    confidence: { type: 'string' as const, enum: ['high', 'medium', 'low'] },
  },
  required: ['answer', 'evidence', 'gaps', 'suggestions', 'confidence'],
  additionalProperties: false,
};

// ── System Prompts ──

const EXTRACTION_SYSTEM_PROMPT = `You are a literary analysis assistant. Given a section of a story or book, extract structured information about the narrative elements present.

Rules:
- Only extract what is explicitly present or strongly implied in the text
- Do NOT invent or assume details not supported by the text
- If the text is non-narrative (foreword, table of contents, acknowledgments, notes), set is_narrative to false, provide a brief summary, and leave all arrays empty
- Keep descriptions concise and evidence-based
- For characters, only list traits and relationships that are shown or stated in this section
- For relationships, use format: "sister of X", "enemy of Y", "mentor to Z"
- For plot_events, list in chronological order as they appear
- For timeline_details, capture any temporal markers ("three days later", "that morning", dates, seasons)
- For foreshadowing, note hints about future or past events only if clearly intentional`;

const CLASSIFICATION_SYSTEM_PROMPT = `You classify whether a user's question is about their own book/story content or about general/world knowledge.

"book" — the question references characters, plot, scenes, settings, events, or details from their writing. Questions about "my" story elements, character names that seem fictional, or requests to analyze their manuscript content.
"general" — the question is about real-world facts, history, science, culture, or general information useful for research.

Respond with a JSON object containing mode and confidence (0 to 1).`;

const BOOK_ANSWER_SYSTEM_PROMPT = `You are a story assistant helping a writer understand their own book. You have been given extracted analysis from their manuscript sections.

Rules:
- Answer based ONLY on what is present in the provided context
- If the context doesn't contain enough information, say so in the answer and list what's missing in gaps
- Include section references (chapter title and section title) when citing evidence
- Keep evidence excerpts brief — summarize what's relevant from each section
- Be direct and helpful — the writer knows their own story, don't explain obvious things
- For each piece of evidence, use the actual sectionId, chapterTitle, and sectionTitle from the context
- In suggestions, propose 2-3 follow-up questions the writer might want to ask
- Set confidence based on how well the context answers the question`;

// ── Helpers ──

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Build a composite text for embedding from an extraction. */
function buildCompositeText(
  extraction: StoryContextExtraction,
  sectionTitle: string | null,
  chapterTitle: string
): string {
  const parts: string[] = [];

  parts.push(`[Section: ${sectionTitle || 'Untitled'}] [Chapter: ${chapterTitle}]`);

  if (extraction.summary) {
    parts.push(`Summary: ${extraction.summary}`);
  }

  if (extraction.characters.length > 0) {
    const chars = extraction.characters
      .map((c) => `${c.name} (${c.description})`)
      .join(', ');
    parts.push(`Characters: ${chars}`);
  }

  if (extraction.settings.length > 0) {
    const locs = extraction.settings.map((s) => s.name).join(', ');
    parts.push(`Locations: ${locs}`);
  }

  if (extraction.plot_events.length > 0) {
    parts.push(`Events: ${extraction.plot_events.join('; ')}`);
  }

  if (extraction.themes.length > 0) {
    parts.push(`Themes: ${extraction.themes.join(', ')}`);
  }

  if (extraction.conflicts.length > 0) {
    parts.push(`Conflicts: ${extraction.conflicts.join('; ')}`);
  }

  return parts.join('\n');
}

// ── Story Context Extraction ──

export async function processSection(sectionId: number, bookId: number): Promise<void> {
  // Load section with chapter info
  const section = await prisma.chapterSection.findUnique({
    where: { id: sectionId },
    include: {
      chapter: {
        select: { id: true, title: true, order: true, bookId: true },
      },
      analysis: true,
    },
  });

  if (!section || section.chapter.bookId !== bookId) {
    throw new Error(`Section ${sectionId} not found or does not belong to book ${bookId}`);
  }

  // Extract plain text
  const plainText = extractPlainText(section.content);
  const contentHash = hashText(plainText);

  // Check if already current
  if (section.analysis && section.analysis.contentHash === contentHash && section.analysis.status === 'completed') {
    return; // Already up to date
  }

  // Too short to analyze
  if (plainText.length < MIN_SECTION_TEXT_LENGTH) {
    await prisma.sectionAnalysis.upsert({
      where: { sectionId },
      create: {
        sectionId,
        bookId,
        contentHash,
        plainText,
        extractedData: { is_narrative: false, summary: '', characters: [], plot_events: [], settings: [], timeline_details: [], themes: [], important_objects: [], conflicts: [], foreshadowing: [] },
        status: 'completed',
      },
      update: {
        contentHash,
        plainText,
        extractedData: { is_narrative: false, summary: '', characters: [], plot_events: [], settings: [], timeline_details: [], themes: [], important_objects: [], conflicts: [], foreshadowing: [] },
        status: 'completed',
        errorMessage: null,
      },
    });
    return;
  }

  // Mark as processing (atomic guard against concurrent processing)
  const existing = await prisma.sectionAnalysis.findUnique({
    where: { sectionId },
    select: { status: true, qdrantPointId: true },
  });

  if (existing?.status === 'processing') {
    return; // Another process is handling this section
  }

  if (existing) {
    // Atomic status transition for existing records
    const updated = await prisma.sectionAnalysis.updateMany({
      where: { sectionId, status: { not: 'processing' } },
      data: { status: 'processing', errorMessage: null },
    });
    if (updated.count === 0) {
      return; // Lost the race — another process claimed it
    }
  } else {
    // New record — we're claiming this section
    await prisma.sectionAnalysis.create({
      data: { sectionId, bookId, contentHash, plainText, extractedData: {}, status: 'processing' },
    });
  }

  try {
    // Truncate for LLM
    const textForLlm = plainText.length > MAX_SECTION_TEXT_LENGTH
      ? plainText.slice(0, MAX_SECTION_TEXT_LENGTH) + '\n[... text truncated ...]'
      : plainText;

    // Call LLM for extraction
    const extraction = await llmComplete<StoryContextExtraction>(
      [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `Extract narrative elements from the following book section:\n\n${textForLlm}` },
      ],
      { name: 'story_extraction', schema: EXTRACTION_JSON_SCHEMA },
      { temperature: 0.2, maxTokens: 1500, timeoutMs: STORY_CONTEXT_TIMEOUT_MS }
    );

    // Build composite text and embed
    const compositeText = buildCompositeText(extraction, section.title, section.chapter.title);
    const embedding = await embed(compositeText);

    // Generate or reuse Qdrant point ID
    const qdrantPointId = existing?.qdrantPointId || randomUUID();

    // Upsert to Qdrant
    await upsertVector(
      qdrantPointId,
      embedding,
      {
        bookId,
        sectionId,
        chapterId: section.chapter.id,
        chapterTitle: section.chapter.title,
        sectionTitle: section.title,
        chapterOrder: section.chapter.order,
        sectionOrder: section.order,
        characters: extraction.characters.map((c) => c.name),
        locations: extraction.settings.map((s) => s.name),
        themes: extraction.themes,
        contentHash,
        updatedAt: new Date().toISOString(),
      },
      STORY_CONTEXT_COLLECTION
    );

    // Update MySQL
    await prisma.sectionAnalysis.update({
      where: { sectionId },
      data: {
        contentHash,
        plainText,
        extractedData: extraction as any,
        status: 'completed',
        qdrantPointId,
        errorMessage: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.sectionAnalysis.update({
      where: { sectionId },
      data: { status: 'failed', errorMessage: message },
    });
    throw error;
  }
}

// ── Query Classification ──

// Fast-path heuristics
const BOOK_PATTERNS = [
  /\b(in my|my)\s+(book|story|chapter|section|novel|manuscript|narrative|writing)\b/i,
  /\bmy\s+(character|protagonist|antagonist|hero|heroine|villain)\b/i,
  /\b(in|from)\s+(chapter|section)\s+\d/i,
];

const GENERAL_PATTERNS = [
  /^(what is|what are|what was|what were|how does|how do|how did)\s/i,
  /\b(history of|definition of|meaning of|explain|define)\b/i,
  /\b(in real life|historically|scientifically|in reality)\b/i,
];

export async function classifyQuery(query: string): Promise<ClassificationResult> {
  // Fast-path: obvious book references
  for (const pattern of BOOK_PATTERNS) {
    if (pattern.test(query)) {
      return { mode: 'book', confidence: 0.95 };
    }
  }

  // Fast-path: obvious general knowledge
  for (const pattern of GENERAL_PATTERNS) {
    if (pattern.test(query)) {
      return { mode: 'general', confidence: 0.85 };
    }
  }

  // LLM classification for ambiguous queries
  try {
    const result = await llmComplete<{ mode: 'book' | 'general'; confidence: number }>(
      [
        { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: `Classify this question: "${query}"` },
      ],
      { name: 'query_classification', schema: CLASSIFICATION_JSON_SCHEMA },
      { temperature: 0.1, maxTokens: 100 }
    );

    // Default to general if low confidence
    if (result.confidence < 0.7) {
      return { mode: 'general', confidence: result.confidence };
    }

    return { mode: result.mode, confidence: result.confidence };
  } catch {
    // If classification fails, default to general
    return { mode: 'general', confidence: 0.5 };
  }
}

// ── Book Query Answering ──

export async function prepareSearchQueries(query: string): Promise<string[]> {
  try {
    const result = await llmComplete<{ sub_queries: string[] }>(
      [
        { role: 'system', content: 'Given a question about a book, generate 1-3 short search queries that would help find relevant sections. Each query should capture a different aspect of the question. Focus on character names, locations, events, and themes mentioned.' },
        { role: 'user', content: `Generate search queries for: "${query}"` },
      ],
      { name: 'query_plan', schema: QUERY_PLAN_JSON_SCHEMA },
      { temperature: 0.1, maxTokens: 200 }
    );

    return result.sub_queries.slice(0, 3);
  } catch {
    // Fallback: use the original query
    return [query];
  }
}

export interface SearchedSection {
  sectionId: number;
  chapterId: number;
  chapterTitle: string;
  sectionTitle: string | null;
  chapterOrder: number;
  sectionOrder: number;
  score: number;
  extraction: StoryContextExtraction;
}

export async function searchBookSections(
  queries: string[],
  bookId: number,
  limit = 5
): Promise<SearchedSection[]> {
  const seenSections = new Set<number>();
  const results: SearchedSection[] = [];

  for (const query of queries) {
    const queryEmbedding = await embed(query);
    const qdrantResults = await searchStoryContext(queryEmbedding, bookId, limit);

    for (const result of qdrantResults) {
      const sectionId = result.payload.sectionId as number;
      if (seenSections.has(sectionId)) continue;
      seenSections.add(sectionId);

      // Load full extraction from MySQL
      const analysis = await prisma.sectionAnalysis.findUnique({
        where: { sectionId },
      });

      if (!analysis || analysis.status !== 'completed') continue;

      results.push({
        sectionId,
        chapterId: result.payload.chapterId as number,
        chapterTitle: result.payload.chapterTitle as string,
        sectionTitle: result.payload.sectionTitle as string | null,
        chapterOrder: result.payload.chapterOrder as number,
        sectionOrder: result.payload.sectionOrder as number,
        score: result.score,
        extraction: analysis.extractedData as unknown as StoryContextExtraction,
      });
    }
  }

  // Sort chronologically
  results.sort((a, b) =>
    a.chapterOrder !== b.chapterOrder
      ? a.chapterOrder - b.chapterOrder
      : a.sectionOrder - b.sectionOrder
  );

  return results;
}

/** Build a context string from searched sections for the LLM. Max ~4000 chars. */
function buildContextForLlm(sections: SearchedSection[]): string {
  const contextParts: string[] = [];
  let totalLength = 0;
  const maxLength = 4000;

  for (const section of sections) {
    const ext = section.extraction;
    const parts: string[] = [];

    parts.push(`--- Section: "${section.sectionTitle || 'Untitled'}" (Chapter: "${section.chapterTitle}", sectionId: ${section.sectionId}) ---`);

    if (ext.summary) parts.push(`Summary: ${ext.summary}`);

    if (ext.characters.length > 0) {
      for (const char of ext.characters) {
        let charLine = `Character: ${char.name} — ${char.description}`;
        if (char.traits.length > 0) charLine += ` | Traits: ${char.traits.join(', ')}`;
        if (char.relationships.length > 0) charLine += ` | Relationships: ${char.relationships.join(', ')}`;
        parts.push(charLine);
      }
    }

    if (ext.plot_events.length > 0) {
      parts.push(`Events: ${ext.plot_events.join('; ')}`);
    }

    if (ext.settings.length > 0) {
      parts.push(`Settings: ${ext.settings.map((s) => `${s.name} (${s.description})`).join(', ')}`);
    }

    if (ext.conflicts.length > 0) {
      parts.push(`Conflicts: ${ext.conflicts.join('; ')}`);
    }

    if (ext.timeline_details.length > 0) {
      parts.push(`Timeline: ${ext.timeline_details.join('; ')}`);
    }

    if (ext.foreshadowing.length > 0) {
      parts.push(`Foreshadowing: ${ext.foreshadowing.join('; ')}`);
    }

    const sectionText = parts.join('\n');

    if (totalLength + sectionText.length > maxLength) break;
    totalLength += sectionText.length;
    contextParts.push(sectionText);
  }

  return contextParts.join('\n\n');
}

export async function answerBookQuestion(
  query: string,
  sections: SearchedSection[]
): Promise<BookQueryResponse> {
  if (sections.length === 0) {
    return {
      answer: 'No relevant sections were found in your book for this question. This could mean the relevant sections haven\'t been analyzed yet, or the topic hasn\'t been covered in the sections that have been indexed.',
      evidence: [],
      gaps: ['No matching sections found in the analyzed content'],
      suggestions: ['Try asking after more sections have been indexed', 'Check the indexing status in the panel header'],
      confidence: 'low',
      mode: 'book',
    };
  }

  const context = buildContextForLlm(sections);

  const result = await llmComplete<{
    answer: string;
    evidence: Array<{ sectionId: number; chapterTitle: string; sectionTitle: string | null; excerpt: string }>;
    gaps: string[];
    suggestions: string[];
    confidence: 'high' | 'medium' | 'low';
  }>(
    [
      { role: 'system', content: BOOK_ANSWER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Book context:\n${context}\n\nQuestion: ${query}`,
      },
    ],
    { name: 'book_answer', schema: BOOK_ANSWER_JSON_SCHEMA },
    { temperature: 0.3, maxTokens: 1000, timeoutMs: STORY_CONTEXT_TIMEOUT_MS }
  );

  return { ...result, mode: 'book' };
}
