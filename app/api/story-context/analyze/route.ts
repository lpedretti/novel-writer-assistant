import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { processSection } from '@/lib/story-context';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  let body: { sectionId?: number; contentHash?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sectionId = body.sectionId;
  if (!sectionId || typeof sectionId !== 'number') {
    return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
  }

  // Verify section ownership
  const section = await prisma.chapterSection.findUnique({
    where: { id: sectionId },
    include: {
      chapter: { select: { bookId: true, book: { select: { userId: true } } } },
      analysis: { select: { contentHash: true, status: true } },
    },
  });

  if (!section || section.chapter.book.userId !== user.userId) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  const bookId = section.chapter.bookId;

  // Check if already current
  if (
    body.contentHash &&
    section.analysis &&
    section.analysis.contentHash === body.contentHash &&
    section.analysis.status === 'completed'
  ) {
    return NextResponse.json({ status: 'already_current' });
  }

  // Check if already processing
  if (section.analysis?.status === 'processing') {
    return NextResponse.json({ status: 'in_progress' });
  }

  // Fire-and-forget processing
  processSection(sectionId, bookId).catch((err) => {
    console.error(`[story-context/analyze] Failed to process section ${sectionId}:`, err);
  });

  return NextResponse.json({ status: 'queued' });
}
