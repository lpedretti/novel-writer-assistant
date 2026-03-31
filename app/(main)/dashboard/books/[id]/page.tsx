import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';
import { BookDetails } from './BookDetails';

async function BookDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const bookId = Number(id);

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  });

  if (!book) {
    redirect('/dashboard/books');
  }

  if (book.userId !== user.userId) {
    redirect('/dashboard/books');
  }

  async function updateBookSettings(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const styleConfigJson = formData.get('styleConfig') as string;

    let styleConfig = null;
    if (styleConfigJson) {
      try {
        styleConfig = JSON.parse(styleConfigJson);
      } catch (e) {
        console.error('Failed to parse styleConfig:', e);
      }
    }

    await prisma.book.update({
      where: { id: bookId, userId: user.userId },
      data: {
        title,
        description,
        styleConfig,
      },
    });

    revalidatePath(`/dashboard/books/${bookId}`);
  }

  return (
    <BookDetails
      book={{
        id: book.id,
        title: book.title,
        description: book.description,
        styleConfig: book.styleConfig as Record<string, unknown> | null,
        chapterCount: book._count.chapters,
      }}
      updateBookSettings={updateBookSettings}
    />
  );
}

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">Loading book details...</p>
          </div>
        </div>
      }
    >
      <BookDetailsContent params={params} />
    </Suspense>
  );
}
