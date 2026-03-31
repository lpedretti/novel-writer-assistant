import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { agenticBookQuery } from '@/lib/story-context-agent';
import { LlamaServerError } from '@/lib/knowledge-assistant';
import type { BookQueryResponse } from '@/lib/story-context';

/** Compute a fingerprint of the book's analyzed content state. */
async function computeBookFingerprint(bookId: number): Promise<string> {
  const analyses = await prisma.sectionAnalysis.findMany({
    where: { bookId, status: 'completed' },
    select: { contentHash: true },
    orderBy: { sectionId: 'asc' },
  });
  const combined = analyses.map((a) => a.contentHash).join(':');
  return createHash('sha256').update(combined).digest('hex');
}

/** Deterministic hash: same query + same book content = same hash. */
function bookQueryHash(query: string, bookId: number, fingerprint: string): string {
  return createHash('sha256')
    .update(`book:${bookId}:${fingerprint}:${query.toLowerCase().trim()}`)
    .digest('hex');
}

/** Flatten a BookQueryResponse into searchable text. */
function flattenBookResponse(response: BookQueryResponse): string {
  return [
    response.answer,
    ...response.evidence.map((e) => e.excerpt),
    ...response.gaps,
    ...response.suggestions,
  ].join(' ');
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  let body: { query?: string; bookId?: number; sectionId?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const bookId = body.bookId;
  if (!bookId || typeof bookId !== 'number') {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  const sectionId = body.sectionId ?? null;

  // Verify book ownership
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });

  if (!book || book.userId !== user.userId) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  try {
    // Compute fingerprint and deterministic hash
    const fingerprint = await computeBookFingerprint(bookId);
    const queryHash = bookQueryHash(query, bookId, fingerprint);

    // Cache lookup
    const cached = await prisma.cachedResponse.findUnique({
      where: { queryHash },
    });

    if (cached) {
      // Cache hit — increment hitCount and create history entry
      prisma.cachedResponse
        .update({ where: { id: cached.id }, data: { hitCount: { increment: 1 } } })
        .catch(() => {});

      prisma.archiveQuery
        .create({
          data: { userId: user.userId, bookId, sectionId, cachedResponseId: cached.id },
        })
        .catch(() => {});

      return NextResponse.json(cached.response);
    }

    // Cache miss — run full pipeline
    const response = await agenticBookQuery(query, bookId);

    // Persist response and history (fire-and-forget)
    prisma.cachedResponse
      .create({
        data: {
          query,
          queryHash,
          locale: 'book',
          response: response as any,
          searchableText: flattenBookResponse(response),
          refusal: false,
        },
      })
      .then((created) =>
        prisma.archiveQuery.create({
          data: { userId: user.userId, bookId, sectionId, cachedResponseId: created.id },
        })
      )
      .catch((err) => {
        console.error('[story-context/query] Failed to persist history:', err);
      });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof LlamaServerError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error('[story-context/query] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process book query' },
      { status: 500 }
    );
  }
}
