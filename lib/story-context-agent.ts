import {
  prepareSearchQueries,
  searchBookSections,
  answerBookQuestion,
  type BookQueryResponse,
  type SearchedSection,
} from './story-context';

const DEFAULT_MAX_STEPS = 3;

// Patterns that suggest complex, multi-step analysis
const COMPLEX_QUERY_PATTERNS = [
  /\b(compare|comparison|difference|differences|contrast|versus|vs)\b/i,
  /\b(between|across|from .+ to)\b/i,
  /\b(change|evolve|develop|progression|arc)\b.*\b(over|through|between|across)\b/i,
  /\b(inconsisten|plot hole|contradiction|continuity)\b/i,
  /\b(all|every|each)\b.*\b(character|location|scene|mention)\b/i,
  /\b(relationship|connection|link)\b.*\b(between|among)\b/i,
  /\b(timeline|chronolog|order of events|sequence)\b/i,
  /\b(summary|overview|recap)\b.*\b(entire|whole|all|full)\b/i,
];

function isComplexQuery(query: string): boolean {
  return COMPLEX_QUERY_PATTERNS.some((pattern) => pattern.test(query));
}

/**
 * Agentic book query handler. For complex queries, decomposes into sub-queries,
 * searches iteratively, and synthesizes a comprehensive answer.
 * For simple queries, falls through to single-pass search + answer.
 */
export async function agenticBookQuery(
  query: string,
  bookId: number,
  maxSteps: number = DEFAULT_MAX_STEPS
): Promise<BookQueryResponse> {
  const complex = isComplexQuery(query);

  if (!complex) {
    // Simple path: single search + answer
    return simpleBookQuery(query, bookId);
  }

  // Complex path: multi-step search
  return complexBookQuery(query, bookId, maxSteps);
}

async function simpleBookQuery(
  query: string,
  bookId: number
): Promise<BookQueryResponse> {
  const searchQueries = await prepareSearchQueries(query);
  const sections = await searchBookSections(searchQueries, bookId);
  return answerBookQuestion(query, sections);
}

async function complexBookQuery(
  query: string,
  bookId: number,
  maxSteps: number
): Promise<BookQueryResponse> {
  // Step 1: Decompose the query into sub-queries
  const searchQueries = await prepareSearchQueries(query);

  // Step 2: Iterative search — gather sections from all sub-queries
  const allSections: SearchedSection[] = [];
  const seenSectionIds = new Set<number>();

  for (let step = 0; step < Math.min(searchQueries.length, maxSteps); step++) {
    const subQuery = searchQueries[step];
    const results = await searchBookSections([subQuery], bookId, 5);

    for (const section of results) {
      if (!seenSectionIds.has(section.sectionId)) {
        seenSectionIds.add(section.sectionId);
        allSections.push(section);
      }
    }
  }

  // If the initial queries didn't find enough context, try the original query directly
  if (allSections.length < 2) {
    const directResults = await searchBookSections([query], bookId, 5);
    for (const section of directResults) {
      if (!seenSectionIds.has(section.sectionId)) {
        seenSectionIds.add(section.sectionId);
        allSections.push(section);
      }
    }
  }

  // Sort chronologically for coherent analysis
  allSections.sort((a, b) =>
    a.chapterOrder !== b.chapterOrder
      ? a.chapterOrder - b.chapterOrder
      : a.sectionOrder - b.sectionOrder
  );

  // Step 3: Synthesize answer from all gathered context
  return answerBookQuestion(query, allSections);
}
