import {
  llmComplete,
  llmCompleteText,
  checkLlmHealth,
  LlamaServerError,
} from './llm-client';

export const MAX_INPUT_CHARS = Number(process.env.KNOWLEDGE_ASSISTANT_MAX_INPUT_CHARS) || 8000;

// Re-export for backward compatibility
export { LlamaServerError };
export { checkLlmHealth as checkLlamaHealth };

// ── Types ──

export interface KnowledgeResponse {
  answer_bullets: string[];
  definitions_and_scope: string[];
  uncertainty_assumptions: string[];
  common_misconceptions: string[];
  writer_hooks: string[];
  verification_keywords: string[];
  refusal: boolean;
  refusal_reason: string | null;
}

interface PolicyResult {
  allowed: boolean;
  refusal_reason?: string;
}

// ── JSON Schema (sent to LLM for structured output) ──

const RESPONSE_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    answer_bullets: { type: 'array' as const, items: { type: 'string' as const } },
    definitions_and_scope: { type: 'array' as const, items: { type: 'string' as const } },
    uncertainty_assumptions: { type: 'array' as const, items: { type: 'string' as const } },
    common_misconceptions: { type: 'array' as const, items: { type: 'string' as const } },
    writer_hooks: { type: 'array' as const, items: { type: 'string' as const } },
    verification_keywords: { type: 'array' as const, items: { type: 'string' as const } },
    refusal: { type: 'boolean' as const },
    refusal_reason: { type: ['string', 'null'] as const },
  },
  required: [
    'answer_bullets',
    'definitions_and_scope',
    'uncertainty_assumptions',
    'common_misconceptions',
    'writer_hooks',
    'verification_keywords',
    'refusal',
    'refusal_reason',
  ],
  additionalProperties: false,
};

// ── Policy Filter ──

export function policyFilter(query: string): PolicyResult {
  // Creative writing generation detection
  const writingGenerationPatterns = [
    /\b(write|draft|compose|generate|produce)\b.{0,10}\b(me |a |an |the |my |some )?(scene|passage|dialogue|poem|story|narrative|chapter|monologue|verse)\b/i,
    /\b(create|come up with)\b.{0,10}\b(a |an |the |my )?(scene|passage|dialogue|poem|story|narrative)\b/i,
  ];

  const researchSignals =
    /\b(explain|describe|summarize|analyze|compare|what is|what are|what was|how did|how does|who |when |where |why |history of|meaning of|about the|in the book|in the novel|in the play)\b/i;

  for (const pattern of writingGenerationPatterns) {
    if (pattern.test(query) && !researchSignals.test(query)) {
      return {
        allowed: false,
        refusal_reason:
          'This assistant provides factual research only. It cannot generate creative writing such as scenes, dialogue, or narratives.',
      };
    }
  }

  // Harmful actionable instructions
  const harmfulPatterns = [
    /\b(how to|instructions for|steps to|guide to|recipe for)\b.{0,30}\b(make|build|create|synthesize|produce|manufacture)\b.{0,30}\b(bomb|explosive|poison|toxin|weapon|nerve agent|mustard gas|sarin)\b/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(query)) {
      return {
        allowed: false,
        refusal_reason: 'This query requests potentially harmful actionable instructions and cannot be processed.',
      };
    }
  }

  return { allowed: true };
}

// ── Build Knowledge Request ──

const SYSTEM_PROMPT = `You are a research assistant for writers. Your role is to provide structured factual information to help with worldbuilding and historical accuracy.

Rules:
- Provide ONLY factual, encyclopedic information
- Do NOT write prose, fiction, dialogue, or narrative text
- Do NOT offer creative suggestions for how to write something
- Structure your response strictly according to the JSON schema
- If the query is outside your knowledge, set refusal to true and explain in refusal_reason
- Use the requested locale for your responses when possible
- Keep bullet points concise and information-dense
- In writer_hooks, suggest sensory details, lesser-known facts, or period-accurate terminology that a writer might find useful for authentic worldbuilding
- In verification_keywords, provide specific terms the writer can search to verify or deepen each point`;

export function buildKnowledgeRequest(query: string, locale: string) {
  return {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `[Locale: ${locale}]\n\n${query}` },
    ],
    schema: { name: 'knowledge_response', schema: RESPONSE_JSON_SCHEMA },
    temperature: 0.3,
    maxTokens: 800,
  };
}

// Backward-compatible aliases
export const buildLlamaRequest = buildKnowledgeRequest;

// ── Call Knowledge Assistant ──

export async function callKnowledgeAssistant(
  request: ReturnType<typeof buildKnowledgeRequest>
): Promise<KnowledgeResponse> {
  return llmComplete<KnowledgeResponse>(
    request.messages,
    request.schema,
    {
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      validate: parseAndValidateResponse,
    }
  );
}

// Backward-compatible alias
export const callLlamaServer = callKnowledgeAssistant;

// ── Parse & Validate Response ──

function parseAndValidateResponse(raw: string): KnowledgeResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new LlamaServerError('Invalid response from knowledge assistant', 502);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new LlamaServerError('Invalid response from knowledge assistant', 502);
  }

  const obj = parsed as Record<string, unknown>;

  const arrayFields = [
    'answer_bullets',
    'definitions_and_scope',
    'uncertainty_assumptions',
    'common_misconceptions',
    'writer_hooks',
    'verification_keywords',
  ] as const;

  for (const field of arrayFields) {
    if (!Array.isArray(obj[field])) {
      throw new LlamaServerError('Invalid response from knowledge assistant', 502);
    }
    obj[field] = (obj[field] as unknown[]).map((item) => String(item));
  }

  if (typeof obj.refusal !== 'boolean') {
    obj.refusal = false;
  }

  if (obj.refusal_reason !== null && typeof obj.refusal_reason !== 'string') {
    obj.refusal_reason = null;
  }

  return obj as unknown as KnowledgeResponse;
}

// ── Follow-up Query Resolution ──

export interface ConversationTurn {
  query: string;
  summary: string;
}

const RESOLUTION_SYSTEM_PROMPT = `You rewrite follow-up questions into standalone, self-contained research queries.
Given a conversation about a topic and a follow-up, produce a single query that:
- Incorporates the topic and scope from the conversation so the query makes sense on its own
- Replaces vague references ("that", "this topic", "more about it") with the actual subject
- Preserves any narrowing or new angle the user introduces (time period, region, subfield, etc.)
- Is a complete research question that someone with no context would understand
- Is concise (one or two sentences max)
Respond with ONLY the rewritten query. No explanations.`;

export async function resolveFollowUpQuery(
  followUp: string,
  conversationContext: ConversationTurn[],
  locale: string
): Promise<string> {
  const contextLines = conversationContext
    .map((turn, i) => `Q${i + 1}: ${turn.query}\nA${i + 1}: ${turn.summary}`)
    .join('\n\n');

  return llmCompleteText(
    [
      { role: 'system', content: RESOLUTION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `[Locale: ${locale}]\n\nConversation so far:\n${contextLines}\n\nFollow-up question: ${followUp}`,
      },
    ],
    { temperature: 0.1, maxTokens: 150 }
  );
}
