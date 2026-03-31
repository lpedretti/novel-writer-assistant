import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { BookEditor } from './BookEditor';

async function BookEditorContent({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const bookId = Number(id);

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      chapters: {
        include: {
          sections: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!book) {
    redirect('/dashboard/books');
  }

  if (book.userId !== user.userId) {
    redirect('/dashboard/books');
  }

  // Server Actions
  async function updateBook(formData: FormData) {
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

    // Don't revalidate - client manages book state locally
  }

  async function addChapter(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const title = formData.get('title') as string;

    // Verify book ownership before adding chapter
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { userId: true },
    });

    if (!book || book.userId !== user.userId) {
      throw new Error('Unauthorized: You do not own this book');
    }

    const maxOrder = await prisma.chapter.findFirst({
      where: { bookId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const chapter = await prisma.chapter.create({
      data: {
        title,
        bookId,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    // Return created chapter so client can update local state
    return { id: chapter.id, title: chapter.title, order: chapter.order };
  }

  async function deleteChapter(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const chapterId = Number(formData.get('chapterId'));

    await prisma.chapter.delete({
      where: { id: chapterId, book: { userId: user.userId } },
    });

    // Don't revalidate - client removes chapter from local state
  }

  async function addSection(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const chapterId = Number(formData.get('chapterId'));
    const title = formData.get('title') as string | null;

    // Verify user owns the book that this chapter belongs to
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: { select: { userId: true } } },
    });

    if (!chapter || chapter.book.userId !== user.userId) {
      throw new Error('Unauthorized: Chapter not found or you do not own this book');
    }

    const maxOrder = await prisma.chapterSection.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const section = await prisma.chapterSection.create({
      data: {
        chapterId,
        title: title || null,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        },
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    // Return created section so client can update local state
    return {
      id: section.id,
      title: section.title,
      content: section.content,
      order: section.order,
      chapterId: section.chapterId,
    };
  }

  async function updateSection(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const sectionId = Number(formData.get('sectionId'));
    const title = formData.get('title') as string | null;
    const contentJson = formData.get('content') as string;

    let content = null;
    if (contentJson) {
      try {
        content = JSON.parse(contentJson);
      } catch (e) {
        console.error('Failed to parse content:', e);
      }
    }

    await prisma.chapterSection.update({
      where: {
        id: sectionId,
        chapter: { book: { userId: user.userId } },
      },
      data: {
        title: title || null,
        content,
      },
    });

    // Don't revalidate - prevents editor from resetting during auto-save
    // Content is saved, will load correctly on page refresh
  }

  async function deleteSection(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const sectionId = Number(formData.get('sectionId'));

    await prisma.chapterSection.delete({
      where: {
        id: sectionId,
        chapter: { book: { userId: user.userId } },
      },
    });

    // Don't revalidate - client removes section from local state
  }

  async function reorderSections(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const sectionsJson = formData.get('sections') as string;

    try {
      const sections = JSON.parse(sectionsJson) as Array<{ id: number; order: number }>;

      await prisma.$transaction(
        sections.map((section) =>
          prisma.chapterSection.update({
            where: {
              id: section.id,
              chapter: { book: { userId: user.userId } },
            },
            data: { order: section.order },
          })
        )
      );

      // Don't revalidate - client updates section order in local state
    } catch (e) {
      console.error('Failed to reorder sections:', e);
    }
  }

  async function updateChapterTitle(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const chapterId = Number(formData.get('chapterId'));
    const title = formData.get('title') as string;

    await prisma.chapter.update({
      where: { id: chapterId, book: { userId: user.userId } },
      data: { title },
    });

    // Don't revalidate - client updates chapter title in local state
  }

  async function updateSectionTitle(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const sectionId = Number(formData.get('sectionId'));
    const title = formData.get('title') as string | null;

    await prisma.chapterSection.update({
      where: {
        id: sectionId,
        chapter: { book: { userId: user.userId } },
      },
      data: { title: title || null },
    });

    // Don't revalidate - client updates section title in local state
  }

  return (
    <BookEditor
      book={book}
      updateBook={updateBook}
      addChapter={addChapter}
      deleteChapter={deleteChapter}
      updateChapterTitle={updateChapterTitle}
      addSection={addSection}
      updateSection={updateSection}
      deleteSection={deleteSection}
      updateSectionTitle={updateSectionTitle}
      reorderSections={reorderSections}
    />
  );
}

export default function BookEditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="mt-4">Loading editor...</p>
          </div>
        </div>
      }
    >
      <BookEditorContent params={params} />
    </Suspense>
  );
}
