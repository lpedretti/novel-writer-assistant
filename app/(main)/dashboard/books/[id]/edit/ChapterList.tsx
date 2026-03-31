'use client';

import { useState, useTransition, useEffect } from 'react';

interface Section {
  id: number;
  title: string | null;
  order: number;
  chapterId: number;
}

interface Chapter {
  id: number;
  title: string;
  order: number;
  sections: Section[];
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedSectionId: number | null;
  onSelectSection: (sectionId: number) => void;
  addChapter: (formData: FormData) => Promise<void>;
  deleteChapter: (formData: FormData) => Promise<void>;
  updateChapterTitle: (formData: FormData) => Promise<void>;
  addSection: (formData: FormData) => Promise<void>;
  deleteSection: (formData: FormData) => Promise<void>;
  updateSectionTitle: (formData: FormData) => Promise<void>;
  bookId: number;
}

export function ChapterList({
  chapters,
  selectedSectionId,
  onSelectSection,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  addSection,
  deleteSection,
  updateSectionTitle,
  bookId,
}: ChapterListProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Load expanded chapters from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem(`expandedChapters_${bookId}`);
    if (saved) {
      try {
        const ids = JSON.parse(saved) as number[];
        setExpandedChapters(new Set(ids));
      } catch (e) {
        console.error('Failed to parse saved expanded chapters:', e);
      }
    }
  }, [bookId]);

  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState<Record<number, string>>({});
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  // Save expanded chapters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`expandedChapters_${bookId}`, JSON.stringify(Array.from(expandedChapters)));
    }
  }, [expandedChapters, bookId]);

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;

    const formData = new FormData();
    formData.append('title', newChapterTitle);
    startTransition(() => {
      addChapter(formData).then(() => {
        setNewChapterTitle('');
      });
    });
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter and all its sections?')) return;

    const formData = new FormData();
    formData.append('chapterId', chapterId.toString());
    startTransition(() => {
      deleteChapter(formData);
    });
  };

  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditingChapterTitle(chapter.title);
  };

  const saveChapterTitle = (chapterId: number) => {
    if (!editingChapterTitle.trim()) {
      setEditingChapterId(null);
      return;
    }

    const formData = new FormData();
    formData.append('chapterId', chapterId.toString());
    formData.append('title', editingChapterTitle);
    startTransition(() => {
      updateChapterTitle(formData).then(() => {
        setEditingChapterId(null);
      });
    });
  };

  const cancelEditingChapter = () => {
    setEditingChapterId(null);
    setEditingChapterTitle('');
  };

  const handleAddSection = (chapterId: number) => {
    const formData = new FormData();
    formData.append('chapterId', chapterId.toString());
    const title = newSectionTitle[chapterId]?.trim() || null;
    if (title) {
      formData.append('title', title);
    }
    startTransition(() => {
      addSection(formData).then(() => {
        setNewSectionTitle({ ...newSectionTitle, [chapterId]: '' });
      });
    });
  };

  const handleDeleteSection = (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    const formData = new FormData();
    formData.append('sectionId', sectionId.toString());
    startTransition(() => {
      deleteSection(formData);
    });
  };

  const startEditingSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title || '');
  };

  const saveSectionTitle = (sectionId: number) => {
    const formData = new FormData();
    formData.append('sectionId', sectionId.toString());
    formData.append('title', editingSectionTitle.trim() || '');
    startTransition(() => {
      updateSectionTitle(formData).then(() => {
        setEditingSectionId(null);
      });
    });
  };

  const cancelEditingSection = () => {
    setEditingSectionId(null);
    setEditingSectionTitle('');
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold flex-1">Chapters & Sections</h2>
      </div>

      {/* Add Chapter Form */}
      <div className="card bg-base-200 mb-4 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New chapter title..."
            className="input input-bordered input-sm flex-1"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChapter();
            }}
          />
          <button
            onClick={handleAddChapter}
            disabled={!newChapterTitle.trim() || isPending}
            className="btn btn-primary btn-sm"
          >
            Add Chapter
          </button>
        </div>
      </div>

      {/* Chapters List */}
      <div className="space-y-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="card bg-base-100 shadow-sm">
            <div className="card-body p-3">
              {/* Chapter Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="btn btn-ghost btn-xs"
                >
                  {expandedChapters.has(chapter.id) ? '▼' : '▶'}
                </button>

                {editingChapterId === chapter.id ? (
                  <>
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1"
                      value={editingChapterTitle}
                      onChange={(e) => setEditingChapterTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveChapterTitle(chapter.id);
                        if (e.key === 'Escape') cancelEditingChapter();
                      }}
                      onBlur={() => saveChapterTitle(chapter.id)}
                      autoFocus
                    />
                  </>
                ) : (
                  <h3
                    className="font-semibold flex-1 cursor-pointer hover:text-primary"
                    onClick={() => startEditingChapter(chapter)}
                    title="Click to edit"
                  >
                    {chapter.title}
                  </h3>
                )}

                <button
                  onClick={() => handleDeleteChapter(chapter.id)}
                  className="btn btn-ghost btn-xs text-error"
                  title="Delete chapter"
                >
                  🗑
                </button>
              </div>

              {/* Expanded Chapter Content */}
              {expandedChapters.has(chapter.id) && (
                <div className="ml-6 mt-2 space-y-2">
                  {/* Sections */}
                  {chapter.sections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center gap-2 p-2 rounded ${
                        selectedSectionId === section.id
                          ? 'bg-primary/10 border-l-4 border-primary shadow-sm'
                          : 'hover:bg-base-200 border-l-4 border-transparent'
                      }`}
                    >
                      {editingSectionId === section.id ? (
                        <>
                          <input
                            type="text"
                            className="input input-bordered input-xs flex-1"
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveSectionTitle(section.id);
                              if (e.key === 'Escape') cancelEditingSection();
                            }}
                            onBlur={() => saveSectionTitle(section.id)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </>
                      ) : (
                        <>
                          <span
                            className="flex-1 text-sm cursor-pointer"
                            onClick={() => onSelectSection(section.id)}
                          >
                            {section.title || <em className="opacity-60">Untitled section</em>}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingSection(section);
                            }}
                            className="btn btn-ghost btn-xs opacity-60 hover:opacity-100"
                            title="Edit title"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className="btn btn-ghost btn-xs opacity-60 hover:opacity-100 hover:text-error"
                            title="Delete section"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add Section Form */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="New section title (optional)..."
                      className="input input-bordered input-xs flex-1"
                      value={newSectionTitle[chapter.id] || ''}
                      onChange={(e) =>
                        setNewSectionTitle({ ...newSectionTitle, [chapter.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSection(chapter.id);
                      }}
                    />
                    <button
                      onClick={() => handleAddSection(chapter.id)}
                      disabled={isPending}
                      className="btn btn-primary btn-xs"
                    >
                      + Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {chapters.length === 0 && (
          <div className="text-center py-8 text-base-content/50">
            <p>No chapters yet. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
