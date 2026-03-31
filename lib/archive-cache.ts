import { createHash } from 'crypto';
import { prisma } from './prisma';
import { embed } from './embedding';
import { searchSimilar, upsertVector } from './qdrant';
import {
  buildLlamaRequest,
  callLlamaServer,
  type KnowledgeResponse,
} from './knowledge-assistant';

const SIMILARITY_THRESHOLD = Number(process.env.EMBEDDING_SIMILARITY_THRESHOLD) || 0.85;

// ── Helpers ──

function hashQuery(query: string): string {
  return createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
}

function flattenResponse(response: KnowledgeResponse): string {
  return [
    ...response.answer_bullets,
    ...response.definitions_and_scope,
    ...response.uncertainty_assumptions,
    ...response.common_misconceptions,
    ...response.writer_hooks,
    ...response.verification_keywords,
  ].join(' ');
}

// ── Main Cache Logic ──

export interface CacheResult {
  response: KnowledgeResponse;
  cachedResponseId: number;
  fromCache: boolean;
}

export async function findOrCreateCachedResponse(
  query: string,
  locale: string
): Promise<CacheResult> {
  const hash = hashQuery(query);

  // 1. Exact-match dedup via queryHash
  const exact = await prisma.cachedResponse.findUnique({
    where: { queryHash: hash },
  });

  if (exact) {
    await prisma.cachedResponse.update({
      where: { id: exact.id },
      data: { hitCount: { increment: 1 } },
    });
    return {
      response: exact.response as unknown as KnowledgeResponse,
      cachedResponseId: exact.id,
      fromCache: true,
    };
  }

  // 2. Semantic similarity via Qdrant
  let semanticHit = false;
  let embedding: number[];

  try {
    embedding = await embed(query);
    const similar = await searchSimilar(embedding, undefined, 1);

    if (similar.length > 0 && similar[0].score >= SIMILARITY_THRESHOLD) {
      const cached = await prisma.cachedResponse.findUnique({
        where: { id: similar[0].cachedResponseId },
      });

      if (cached) {
        await prisma.cachedResponse.update({
          where: { id: cached.id },
          data: { hitCount: { increment: 1 } },
        });
        return {
          response: cached.response as unknown as KnowledgeResponse,
          cachedResponseId: cached.id,
          fromCache: true,
        };
      }
    }
  } catch {
    // Qdrant or embedding unavailable — fall through to llama
    embedding = [];
    semanticHit = false;
  }

  // 3. Cache miss — call llama
  const llamaRequest = buildLlamaRequest(query, locale);
  const response = await callLlamaServer(llamaRequest);

  // 4. Persist to MySQL
  const cached = await prisma.cachedResponse.create({
    data: {
      query,
      queryHash: hash,
      locale,
      response: response as any,
      searchableText: flattenResponse(response),
      refusal: response.refusal,
      refusalReason: response.refusal_reason,
    },
  });

  // 5. Upsert to Qdrant (best-effort — don't fail the request if Qdrant is down)
  try {
    if (embedding.length > 0) {
      await upsertVector(cached.id, embedding, {
        locale,
        refusal: response.refusal,
      });
    } else {
      const freshEmbedding = await embed(query);
      await upsertVector(cached.id, freshEmbedding, {
        locale,
        refusal: response.refusal,
      });
    }
  } catch {
    // Qdrant unavailable — vector will be missing, exact-match still works
  }

  return {
    response,
    cachedResponseId: cached.id,
    fromCache: false,
  };
}

// ── Archive Entry ──

export async function createArchiveEntry(
  userId: number,
  bookId: number,
  sectionId: number | null,
  cachedResponseId: number,
  originalQuery?: string | null
) {
  return prisma.archiveQuery.create({
    data: {
      userId,
      bookId,
      sectionId,
      cachedResponseId,
      ...(originalQuery ? { originalQuery } : {}),
    },
  });
}

// ── Search / History ──

export async function getArchiveHistory(
  bookId: number,
  userId: number,
  options: { sectionId?: number; q?: string; limit?: number } = {}
) {
  const { sectionId, q, limit = 50 } = options;

  return prisma.archiveQuery.findMany({
    where: {
      bookId,
      userId,
      ...(sectionId != null ? { sectionId } : {}),
      ...(q
        ? {
            cachedResponse: {
              OR: [
                { query: { contains: q } },
                { searchableText: { contains: q } },
              ],
            },
          }
        : {}),
    },
    include: {
      cachedResponse: true,
      section: {
        select: {
          id: true,
          title: true,
          chapter: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
