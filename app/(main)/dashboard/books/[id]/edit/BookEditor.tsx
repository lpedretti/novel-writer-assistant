'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChapterList } from './ChapterList';
import { SectionEditor } from './SectionEditor';
import { KnowledgeAssistant } from '@/components/editor/KnowledgeAssistant';

interface Section {
  id: number;
  title: string | null;
  content: unknown;
  order: number;
  chapterId: number;
}

interface Chapter {
  id: number;
  title: string;
  order: number;
  sections: Section[];
}

interface Book {
  id: number;
  title: string;
  description: string | null;
  styleConfig: unknown;
  chapters: Chapter[];
}

interface BookEditorProps {
  book: Book;
  updateBook: (formData: FormData) => Promise<void>;
  addChapter: (formData: FormData) => Promise<{ id: number; title: string; order: number }>;
  deleteChapter: (formData: FormData) => Promise<void>;
  updateChapterTitle: (formData: FormData) => Promise<void>;
  addSection: (formData: FormData) => Promise<{ id: number; title: string | null; content: unknown; order: number; chapterId: number }>;
  updateSection: (formData: FormData) => Promise<void>;
  deleteSection: (formData: FormData) => Promise<void>;
  updateSectionTitle: (formData: FormData) => Promise<void>;
  reorderSections: (formData: FormData) => Promise<void>;
}

export function BookEditor({
  book: initialBook,
  updateBook: serverUpdateBook,
  addChapter: serverAddChapter,
  deleteChapter: serverDeleteChapter,
  updateChapterTitle: serverUpdateChapterTitle,
  addSection: serverAddSection,
  updateSection,
  deleteSection: serverDeleteSection,
  updateSectionTitle: serverUpdateSectionTitle,
  reorderSections: serverReorderSections,
}: BookEditorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [book, setBook] = useState(initialBook);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // Cache section content to preserve edits when switching between sections
  const [sectionContentCache, setSectionContentCache] = useState<Map<number, unknown>>(new Map());

  // ── Wrapper functions: call server action, then update local book state ──

  const addChapter = useCallback(async (formData: FormData) => {
    const created = await serverAddChapter(formData);
    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, {
        ...created,
        sections: [],
      }],
    }));
  }, [serverAddChapter]);

  const deleteChapter = useCallback(async (formData: FormData) => {
    const chapterId = Number(formData.get('chapterId'));
    await serverDeleteChapter(formData);
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId),
    }));
  }, [serverDeleteChapter]);

  const updateChapterTitle = useCallback(async (formData: FormData) => {
    const chapterId = Number(formData.get('chapterId'));
    const title = formData.get('title') as string;
    await serverUpdateChapterTitle(formData);
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, title } : ch
      ),
    }));
  }, [serverUpdateChapterTitle]);

  const addSection = useCallback(async (formData: FormData) => {
    const created = await serverAddSection(formData);
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
        ch.id === created.chapterId
          ? { ...ch, sections: [...ch.sections, created] }
          : ch
      ),
    }));
  }, [serverAddSection]);

  const deleteSection = useCallback(async (formData: FormData) => {
    const sectionId = Number(formData.get('sectionId'));
    await serverDeleteSection(formData);
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        sections: ch.sections.filter(s => s.id !== sectionId),
      })),
    }));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }, [serverDeleteSection, selectedSectionId]);

  const updateSectionTitle = useCallback(async (formData: FormData) => {
    const sectionId = Number(formData.get('sectionId'));
    const title = (formData.get('title') as string)?.trim() || null;
    await serverUpdateSectionTitle(formData);
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        sections: ch.sections.map(s =>
          s.id === sectionId ? { ...s, title } : s
        ),
      })),
    }));
  }, [serverUpdateSectionTitle]);

  const reorderSections = useCallback(async (formData: FormData) => {
    const sectionsJson = formData.get('sections') as string;
    const updates = JSON.parse(sectionsJson) as Array<{ id: number; order: number }>;
    await serverReorderSections(formData);
    const orderMap = new Map(updates.map(u => [u.id, u.order]));
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => ({
        ...ch,
        sections: ch.sections
          .map(s => orderMap.has(s.id) ? { ...s, order: orderMap.get(s.id)! } : s)
          .sort((a, b) => a.order - b.order),
      })),
    }));
  }, [serverReorderSections]);

  const updateBook = useCallback(async (formData: FormData) => {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const styleConfigJson = formData.get('styleConfig') as string;
    await serverUpdateBook(formData);
    setBook(prev => ({
      ...prev,
      title,
      description,
      ...(styleConfigJson ? { styleConfig: JSON.parse(styleConfigJson) } : {}),
    }));
  }, [serverUpdateBook]);

  // Wrapper to update URL when selecting a section
  const handleSelectSection = useCallback((sectionId: number) => {
    setSelectedSectionId(sectionId);
    // Update URL to preserve selection across revalidations
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', sectionId.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const selectedSection = book.chapters
    .flatMap((ch) => ch.sections)
    .find((s) => s.id === selectedSectionId);

  // If we have cached content for the selected section, use it instead of server data
  const selectedSectionWithCache = selectedSection ? {
    ...selectedSection,
    content: sectionContentCache.get(selectedSection.id) ?? selectedSection.content,
  } : undefined;

  // Handle URL parameters for section navigation
  useEffect(() => {
    const sectionParam = searchParams.get('section');

    if (sectionParam) {
      const sectionId = parseInt(sectionParam);
      setSelectedSectionId(sectionId);
    }
  }, [searchParams]);

  const styleConfig = (typeof book.styleConfig === 'object' && book.styleConfig !== null
    ? book.styleConfig
    : {
        h1Font: 'serif',
        h2Font: 'serif',
        h3Font: 'serif',
        bodyFont: 'sans-serif',
      }) as Record<string, unknown>;

  // Wrapper for updateSection that caches content before saving
  const updateSectionWithCache = useCallback(async (formData: FormData) => {
    const sectionId = Number(formData.get('sectionId'));
    const contentJson = formData.get('content') as string;

    if (contentJson) {
      try {
        const content = JSON.parse(contentJson);
        // Update cache before saving
        setSectionContentCache(prev => {
          const newCache = new Map(prev);
          newCache.set(sectionId, content);
          return newCache;
        });
      } catch (e) {
        console.error('Failed to parse content for cache:', e);
      }
    }

    // Call the original updateSection
    await updateSection(formData);
  }, [updateSection]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="border-b border-base-300 p-4 bg-base-100 flex items-center gap-4">
        <Link href={`/dashboard/books/${book.id}`} className="btn btn-ghost btn-sm">
          ← Back to Details
        </Link>
        <h1 className="text-2xl font-bold flex-1">{book.title}</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chapter/Section Tree - Left */}
        <div className="w-96 border-r border-base-300 overflow-y-auto bg-base-50">
          <ChapterList
            chapters={book.chapters}
            selectedSectionId={selectedSectionId}
            onSelectSection={handleSelectSection}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            addSection={addSection}
            deleteSection={deleteSection}
            updateSectionTitle={updateSectionTitle}
            bookId={book.id}
          />
        </div>

        {/* Editor - Right */}
        <div className="flex-1 overflow-y-auto">
          {selectedSectionWithCache ? (
            <SectionEditor
              section={selectedSectionWithCache}
              updateSection={updateSectionWithCache}
              styleConfig={styleConfig as Record<string, string>}
              bookId={book.id}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-base-content/50">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 mx-auto mb-4 opacity-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <p className="text-lg">Select a section to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <KnowledgeAssistant bookId={book.id} sectionId={selectedSectionId} />
    </div>
  );
}
