'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { ParagraphWithMargins } from './ParagraphExtension';
import { FontReset } from './FontResetExtension';
import { useEffect } from 'react';
import { getFontById } from '@/lib/fonts';

export interface TiptapEditorProps {
  content: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
  editable?: boolean;
  styleConfig?: {
    h1Font?: string;
    h2Font?: string;
    h3Font?: string;
    bodyFont?: string;
    blockquoteFont?: string;
  };
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  styleConfig = {},
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        paragraph: false, // We're using our custom paragraph extension
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
    content: content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    },
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[500px] p-4',
        style: styleConfig.bodyFont
          ? `font-family: ${getFontById(styleConfig.bodyFont)?.fallback || 'serif'}`
          : '',
      },
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Apply font styles to headings and blockquotes
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;

    const h1Font = getFontById(styleConfig.h1Font || 'serif');
    const h2Font = getFontById(styleConfig.h2Font || 'serif');
    const h3Font = getFontById(styleConfig.h3Font || 'serif');
    const blockquoteFont = getFontById(styleConfig.blockquoteFont || 'serif');

    if (h1Font) {
      editorElement.style.setProperty('--h1-font', h1Font.fallback);
    }
    if (h2Font) {
      editorElement.style.setProperty('--h2-font', h2Font.fallback);
    }
    if (h3Font) {
      editorElement.style.setProperty('--h3-font', h3Font.fallback);
    }
    if (blockquoteFont) {
      editorElement.style.setProperty('--blockquote-font', blockquoteFont.fallback);
    }
  }, [editor, styleConfig]);

  if (!editor) {
    return <div className="text-center py-8">Loading editor...</div>;
  }

  return (
    <div className="tiptap-editor-wrapper">
      <EditorContent editor={editor} />
      <style jsx global>{`
        .ProseMirror h1,
        .tiptap-editor-wrapper h1 {
          font-family: var(--h1-font, inherit) !important;
        }
        .ProseMirror h2,
        .tiptap-editor-wrapper h2 {
          font-family: var(--h2-font, inherit) !important;
        }
        .ProseMirror h3,
        .tiptap-editor-wrapper h3 {
          font-family: var(--h3-font, inherit) !important;
        }
        .ProseMirror blockquote,
        .ProseMirror blockquote p,
        .tiptap-editor-wrapper blockquote,
        .tiptap-editor-wrapper blockquote p {
          font-family: var(--blockquote-font, inherit) !important;
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
