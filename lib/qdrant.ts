import { QdrantClient } from '@qdrant/js-client-rest';
import { EMBEDDING_DIMENSIONS } from './embedding';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';

// Collection names
const ARCHIVE_CACHE_COLLECTION = process.env.QDRANT_COLLECTION || 'archive_cache';
export const STORY_CONTEXT_COLLECTION = process.env.QDRANT_STORY_COLLECTION || 'story_context';

let client: QdrantClient | null = null;
const readyCollections = new Set<string>();

function getClient(): QdrantClient {
  if (!client) {
    client = new QdrantClient({ url: QDRANT_URL });
  }
  return client;
}

export async function ensureCollection(
  collectionName: string = ARCHIVE_CACHE_COLLECTION
): Promise<void> {
  if (readyCollections.has(collectionName)) return;

  const qdrant = getClient();
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === collectionName);

  if (!exists) {
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: EMBEDDING_DIMENSIONS,
        distance: 'Cosine',
      },
    });
  }

  readyCollections.add(collectionName);
}

export interface SimilarResult {
  cachedResponseId: number;
  score: number;
}

export async function searchSimilar(
  embedding: number[],
  locale?: string,
  limit = 1,
  collection: string = ARCHIVE_CACHE_COLLECTION
): Promise<SimilarResult[]> {
  await ensureCollection(collection);
  const qdrant = getClient();

  const filter = locale
    ? { must: [{ key: 'locale', match: { value: locale } }] }
    : undefined;

  const results = await qdrant.query(collection, {
    query: embedding,
    filter,
    limit,
    with_payload: false,
  });

  return results.points.map((point) => ({
    cachedResponseId: point.id as number,
    score: point.score!,
  }));
}

export interface StoryContextResult {
  pointId: string;
  score: number;
  payload: Record<string, unknown>;
}

export async function searchStoryContext(
  embedding: number[],
  bookId: number,
  limit = 5,
  scoreThreshold = 0.55
): Promise<StoryContextResult[]> {
  await ensureCollection(STORY_CONTEXT_COLLECTION);
  const qdrant = getClient();

  const results = await qdrant.query(STORY_CONTEXT_COLLECTION, {
    query: embedding,
    filter: {
      must: [{ key: 'bookId', match: { value: bookId } }],
    },
    limit,
    with_payload: true,
    score_threshold: scoreThreshold,
  });

  return results.points.map((point) => ({
    pointId: point.id as string,
    score: point.score!,
    payload: (point.payload ?? {}) as Record<string, unknown>,
  }));
}

export async function upsertVector(
  id: number | string,
  embedding: number[],
  metadata: Record<string, unknown>,
  collection: string = ARCHIVE_CACHE_COLLECTION
): Promise<void> {
  await ensureCollection(collection);
  const qdrant = getClient();

  await qdrant.upsert(collection, {
    points: [
      {
        id,
        vector: embedding,
        payload: metadata,
      },
    ],
  });
}

export async function deleteVector(
  id: number | string,
  collection: string = ARCHIVE_CACHE_COLLECTION
): Promise<void> {
  await ensureCollection(collection);
  const qdrant = getClient();

  await qdrant.delete(collection, {
    points: [id],
  });
}
