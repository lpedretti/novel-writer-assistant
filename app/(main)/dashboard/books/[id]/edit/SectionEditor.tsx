'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { ParagraphWithMargins } from '@/components/editor/ParagraphExtension';
import { FontReset } from '@/components/editor/FontResetExtension';
import { getFontById } from '@/lib/fonts';

interface Section {
  id: number;
  title: string | null;
  content: unknown;
  chapterId: number;
}

interface SectionEditorProps {
  section: Section;
  updateSection: (formData: FormData) => Promise<void>;
  styleConfig: Record<string, string>;
  bookId: number;
}

export function SectionEditor({ section, updateSection, styleConfig, bookId }: SectionEditorProps) {
  const router = useRouter();
  const [sectionTitle, setSectionTitle] = useState(section.title || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [analysisState, setAnalysisState] = useState<'indexed' | 'pending' | null>(null);
  const [isPending, startTransition] = useTransition();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTitleRef = useRef(sectionTitle);

  // Keep refs up to date
  useEffect(() => {
    currentTitleRef.current = sectionTitle;
  }, [sectionTitle]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: false,
      }),
      ParagraphWithMargins,
      TextAlign.configure({
        types: ['paragraph'],
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontReset,
    ],
    content: (typeof section.content === 'object' && section.content !== null
      ? section.content
      : {
          type: 'doc',
          content: [{ type: 'paragraph', content: [] }],
        }) as Record<string, unknown>,
    onUpdate: ({ editor, transaction }) => {
      // Don't trigger auto-save for non-content updates
      if (transaction.getMeta('preventAutoSave')) {
        return;
      }
      // Trigger auto-save when content changes
      triggerAutoSave(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] p-4',
        style: styleConfig.bodyFont
          ? `font-family: ${getFontById(styleConfig.bodyFont)?.fallback || 'serif'}`
          : '',
      },
    },
  });

  // Update editor content when section changes
  useEffect(() => {
    if (editor) {
      const content = (typeof section.content === 'object' && section.content !== null
        ? section.content
        : {
            type: 'doc',
            content: [{ type: 'paragraph', content: [] }],
          }) as Record<string, unknown>;

      // Defer setContent to avoid flushSync during render
      queueMicrotask(() => {
        editor.commands.setContent(content);
      });

      setSectionTitle(section.title || '');
      setSaveStatus('idle');
      // Clear any pending saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    }

    // Cleanup: Save immediately when leaving this section (only when section.id changes)
    return () => {
      if (editor && !editor.isDestroyed) {
        // Cancel pending auto-save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        // Save current content immediately (deferred to avoid state updates during cleanup)
        const currentContent = editor.getJSON() as Record<string, unknown>;
        const formData = new FormData();
        formData.append('sectionId', section.id.toString());
        formData.append('title', currentTitleRef.current || '');
        formData.append('content', JSON.stringify(currentContent));

        // Defer the save to run after cleanup completes
        queueMicrotask(() => {
          updateSection(formData);
        });
      }
    };
  }, [section.id, editor, updateSection]);

  // Immediate save function (no debounce)
  const saveImmediately = (content: Record<string, unknown>, title: string, sectionId: number) => {
    const formData = new FormData();
    formData.append('sectionId', sectionId.toString());
    formData.append('title', title || '');
    formData.append('content', JSON.stringify(content));

    return updateSection(formData);
  };

  const triggerAutoSave = (content: Record<string, unknown>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('idle');

    // Set new timeout for auto-save (debounce 2 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      saveImmediately(content, sectionTitle, section.id).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      });
    }, 2000);
  };

  const handleTitleChange = (newTitle: string) => {
    setSectionTitle(newTitle);
    // Trigger auto-save for title change
    if (editor) {
      triggerAutoSave(editor.getJSON() as Record<string, unknown>);
    }
  };

  // Check analysis status for current section (once on section change, no polling)
  useEffect(() => {
    const fetchAnalysisState = async () => {
      try {
        const res = await fetch(`/api/story-context/status?bookId=${bookId}`);
        if (!res.ok) return;
        const data = await res.json();
        const sectionStatus = data.sections?.find(
          (s: { sectionId: number }) => s.sectionId === section.id
        );
        setAnalysisState(sectionStatus?.status === 'completed' ? 'indexed' : sectionStatus ? 'pending' : null);
      } catch {
        // Silently fail
      }
    };

    fetchAnalysisState();
  }, [section.id, bookId]);

  // Reset analysis state to pending after save (content likely changed)
  useEffect(() => {
    if (saveStatus === 'saved' && analysisState === 'indexed') {
      setAnalysisState('pending');
    }
  }, [saveStatus, analysisState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!editor) {
    return <div className="text-center py-8">Loading editor...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Title and Save Status */}
      <div className="border-b border-base-300 p-4 bg-base-100">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Section title (optional)..."
            className="input input-bordered flex-1"
            value={sectionTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <div className="flex items-center gap-2 min-w-[100px]">
            {saveStatus === 'saving' && (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-success">Saved</span>
              </>
            )}
            {analysisState === 'indexed' && (
              <span className="w-2 h-2 rounded-full bg-success" title="Story indexed" />
            )}
            {analysisState === 'pending' && (
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Indexing pending" />
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror h1,
        .tiptap-editor-wrapper h1 {
          font-family: ${getFontById(styleConfig.h1Font)?.fallback || 'serif'} !important;
        }
        .ProseMirror h2,
        .tiptap-editor-wrapper h2 {
          font-family: ${getFontById(styleConfig.h2Font)?.fallback || 'serif'} !important;
        }
        .ProseMirror h3,
        .tiptap-editor-wrapper h3 {
          font-family: ${getFontById(styleConfig.h3Font)?.fallback || 'serif'} !important;
        }
        .ProseMirror blockquote,
        .ProseMirror blockquote p,
        .tiptap-editor-wrapper blockquote,
        .tiptap-editor-wrapper blockquote p {
          font-family: ${getFontById(styleConfig.blockquoteFont)?.fallback || 'serif'} !important;
          font-size: 1.15em !important;
        }

        /* Size adjustments for artistic fonts to match visual weight */
        .ProseMirror p[style*="great-vibes"],
        .ProseMirror blockquote p[style*="great-vibes"],
        .ProseMirror [style*="great-vibes"] {
          font-size: 1.4em !important;
        }
        .ProseMirror p[style*="tangerine"],
        .ProseMirror blockquote p[style*="tangerine"],
        .ProseMirror [style*="tangerine"] {
          font-size: 1.3em !important;
        }
        .ProseMirror p[style*="italianno"],
        .ProseMirror blockquote p[style*="italianno"],
        .ProseMirror [style*="italianno"] {
          font-size: 1.35em !important;
        }
        .ProseMirror p[style*="herr-von-muellerhoff"],
        .ProseMirror blockquote p[style*="herr-von-muellerhoff"],
        .ProseMirror [style*="herr-von-muellerhoff"] {
          font-size: 1.5em !important;
        }
        .ProseMirror p[style*="dancing-script"],
        .ProseMirror blockquote p[style*="dancing-script"],
        .ProseMirror [style*="dancing-script"] {
          font-size: 1.25em !important;
        }
        .ProseMirror p[style*="marck-script"],
        .ProseMirror blockquote p[style*="marck-script"],
        .ProseMirror [style*="marck-script"] {
          font-size: 1.3em !important;
        }
      `}</style>
    </div>
  );
}
