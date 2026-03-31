import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import {
  policyFilter,
  LlamaServerError,
  MAX_INPUT_CHARS,
  resolveFollowUpQuery,
  type KnowledgeResponse,
  type ConversationTurn,
} from '@/lib/knowledge-assistant';
import {
  findOrCreateCachedResponse,
  createArchiveEntry,
} from '@/lib/archive-cache';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Auth: require login
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Auth: require CREATOR or ADMINISTRATOR role
  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Parse request body
  let body: {
    query?: string;
    user_locale?: string;
    bookId?: number;
    sectionId?: number | null;
    conversationContext?: ConversationTurn[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate query
  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  if (query.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: 'Query exceeds maximum length' }, { status: 400 });
  }

  // Validate bookId
  const bookId = body.bookId;
  if (!bookId || typeof bookId !== 'number') {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  // Verify book ownership
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });
  if (!book || book.userId !== user.userId) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const locale = body.user_locale || 'en';
  const sectionId = body.sectionId ?? null;

  // Policy filter on original query (lightweight, no model call)
  const policy = policyFilter(query);
  if (!policy.allowed) {
    const refusalResponse: KnowledgeResponse = {
      answer_bullets: [],
      definitions_and_scope: [],
      uncertainty_assumptions: [],
      common_misconceptions: [],
      writer_hooks: [],
      verification_keywords: [],
      refusal: true,
      refusal_reason: policy.refusal_reason!,
    };
    return NextResponse.json(refusalResponse);
  }

  // ── Follow-up Resolution ──
  let resolvedQuery = query;
  let originalQuery: string | null = null;

  // Validate and sanitize conversationContext
  let context = body.conversationContext;
  if (context) {
    if (!Array.isArray(context)) {
      context = undefined;
    } else {
      context = context
        .filter(
          (turn): turn is ConversationTurn =>
            typeof turn.query === 'string' && typeof turn.summary === 'string'
        )
        .slice(-3);
      if (context.length === 0) context = undefined;
    }
  }

  if (context) {
    try {
      resolvedQuery = await resolveFollowUpQuery(query, context, locale);

      // If resolved query is essentially the same, skip tracking it as a follow-up
      if (resolvedQuery.toLowerCase().trim() !== query.toLowerCase().trim()) {
        originalQuery = query;

        // Policy filter on resolved query too (defense against crafted follow-ups)
        const resolvedPolicy = policyFilter(resolvedQuery);
        if (!resolvedPolicy.allowed) {
          const refusalResponse: KnowledgeResponse = {
            answer_bullets: [],
            definitions_and_scope: [],
            uncertainty_assumptions: [],
            common_misconceptions: [],
            writer_hooks: [],
            verification_keywords: [],
            refusal: true,
            refusal_reason: resolvedPolicy.refusal_reason!,
          };
          return NextResponse.json(refusalResponse);
        }
      }
    } catch {
      // Resolution failed — fall back to using the original query as-is
      resolvedQuery = query;
      originalQuery = null;
    }
  }

  // Find or create cached response, then link to user's archive
  try {
    const { response, cachedResponseId } = await findOrCreateCachedResponse(resolvedQuery, locale);

    // Create the user's archive entry (non-blocking for the response)
    createArchiveEntry(user.userId, bookId, sectionId, cachedResponseId, originalQuery).catch(() => {
      // Archive entry creation failure shouldn't affect the response
    });

    return NextResponse.json({
      ...response,
      ...(originalQuery ? { resolvedQuery } : {}),
    });
  } catch (error) {
    if (error instanceof LlamaServerError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: 'Knowledge assistant service unavailable' },
      { status: 502 }
    );
  }
}
