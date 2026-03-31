import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getArchiveHistory } from '@/lib/archive-cache';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'CREATOR' && user.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const bookIdStr = searchParams.get('bookId');
  if (!bookIdStr) {
    return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
  }

  const bookId = parseInt(bookIdStr, 10);
  if (isNaN(bookId)) {
    return NextResponse.json({ error: 'Invalid bookId' }, { status: 400 });
  }

  // Verify book ownership
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });
  if (!book || book.userId !== user.userId) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const sectionIdStr = searchParams.get('sectionId');
  const sectionId = sectionIdStr ? parseInt(sectionIdStr, 10) : undefined;

  const q = searchParams.get('q') || undefined;

  try {
    const entries = await getArchiveHistory(bookId, user.userId, {
      sectionId: sectionId && !isNaN(sectionId) ? sectionId : undefined,
      q,
    });

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch archive history' },
      { status: 500 }
    );
  }
}
