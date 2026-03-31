import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
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
  const bookId = parseInt(searchParams.get('bookId') || '');

  if (!bookId || isNaN(bookId)) {
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

  // Count total sections in the book
  const totalSections = await prisma.chapterSection.count({
    where: { chapter: { bookId } },
  });

  // Get analysis status breakdown
  const analyses = await prisma.sectionAnalysis.findMany({
    where: { bookId },
    select: {
      sectionId: true,
      status: true,
      updatedAt: true,
    },
  });

  const completed = analyses.filter((a) => a.status === 'completed').length;
  const processing = analyses.filter((a) => a.status === 'processing').length;
  const failed = analyses.filter((a) => a.status === 'failed').length;
  const pending = totalSections - analyses.length;

  return NextResponse.json({
    total: totalSections,
    completed,
    processing,
    failed,
    pending,
    sections: analyses.map((a) => ({
      sectionId: a.sectionId,
      status: a.status,
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
}
