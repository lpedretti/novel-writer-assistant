'use client';

import { Editor } from '@tiptap/react';
import { memo, useState, useEffect } from 'react';
import { BODY_FONTS, SYSTEM_FONTS } from '@/lib/fonts';

export interface EditorToolbarProps {
  editor: Editor | null;
}

interface EditorState {
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
  isParagraph: boolean;
  isH1: boolean;
  isH2: boolean;
  isH3: boolean;
  isAlignLeft: boolean;
  isAlignCenter: boolean;
  isAlignRight: boolean;
  isAlignJustify: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

function useEditorState(editor: Editor | null): EditorState {
  const [state, setState] = useState<EditorState>({
    isBold: false,
    isItalic: false,
    isStrike: false,
    isParagraph: false,
    isH1: false,
    isH2: false,
    isH3: false,
    isAlignLeft: false,
    isAlignCenter: false,
    isAlignRight: false,
    isAlignJustify: false,
    isBulletList: false,
    isOrderedList: false,
    isBlockquote: false,
    canUndo: false,
    canRedo: false,
  });

  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      setState({
        isBold: editor.isActive('bold'),
        isItalic: editor.isActive('italic'),
        isStrike: editor.isActive('strike'),
        isParagraph: editor.isActive('paragraph'),
        isH1: editor.isActive('heading', { level: 1 }),
        isH2: editor.isActive('heading', { level: 2 }),
        isH3: editor.isActive('heading', { level: 3 }),
        isAlignLeft: editor.isActive({ textAlign: 'left' }),
        isAlignCenter: editor.isActive({ textAlign: 'center' }),
        isAlignRight: editor.isActive({ textAlign: 'right' }),
        isAlignJustify: editor.isActive({ textAlign: 'justify' }),
        isBulletList: editor.isActive('bulletList'),
        isOrderedList: editor.isActive('orderedList'),
        isBlockquote: editor.isActive('blockquote'),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      });
    };

    // Update immediately
    updateState();

    // Subscribe to selection and content updates
    // selectionUpdate: fires when cursor moves or selection changes
    // update: fires when content changes (needed for undo/redo state)
    editor.on('selectionUpdate', updateState);
    editor.on('update', updateState);

    return () => {
      editor.off('selectionUpdate', updateState);
      editor.off('update', updateState);
    };
  }, [editor]);

  return state;
}

const ToolbarButton = memo(({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'} ${
      disabled ? 'btn-disabled' : ''
    }`}
  >
    {children}
  </button>
));

ToolbarButton.displayName = 'ToolbarButton';

export const EditorToolbar = memo(({ editor }: EditorToolbarProps) => {
  const state = useEditorState(editor);
  const [currentFont, setCurrentFont] = useState<string>('');

  // Update current font when selection changes
  useEffect(() => {
    if (!editor) return;

    const updateCurrentFont = () => {
      const fontFamily = editor.getAttributes('textStyle').fontFamily || '';
      setCurrentFont(fontFamily);
    };

    updateCurrentFont();
    editor.on('selectionUpdate', updateCurrentFont);
    editor.on('update', updateCurrentFont);

    return () => {
      editor.off('selectionUpdate', updateCurrentFont);
      editor.off('update', updateCurrentFont);
    };
  }, [editor]);

  const handleFontChange = (fontFallback: string) => {
    if (!editor) return;

    if (fontFallback === 'reset') {
      editor.chain().focus().unsetFontFamily().run();
      setCurrentFont('');
    } else {
      editor.chain().focus().setFontFamily(fontFallback).run();
      setCurrentFont(fontFallback);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-base-300 p-2 flex flex-wrap gap-2 bg-base-200 sticky top-0 z-10">
      {/* Font Selector */}
      <select
        className="select select-bordered select-sm min-w-[180px]"
        value={currentFont}
        onChange={(e) => handleFontChange(e.target.value)}
        title="Font Family"
      >
        <option value="reset">Default Font</option>
        <optgroup label="Body & Quote Fonts">
          {BODY_FONTS.map((font) => (
            <option key={font.id} value={font.fallback} style={{ fontFamily: font.fallback }}>
              {font.displayName}
            </option>
          ))}
        </optgroup>
        <optgroup label="System Fonts">
          {SYSTEM_FONTS.map((font) => (
            <option key={font.id} value={font.fallback} style={{ fontFamily: font.fallback }}>
              {font.displayName}
            </option>
          ))}
        </optgroup>
      </select>

      <div className="divider divider-horizontal m-0"></div>

      {/* Text Style Group */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={state.isBold}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={state.isItalic}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={state.isStrike}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      <div className="divider divider-horizontal m-0"></div>

      {/* Heading Group */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={state.isParagraph}
          title="Paragraph"
        >
          P
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={state.isH1}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={state.isH2}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={state.isH3}
          title="Heading 3"
        >
          H3
        </ToolbarButton>
      </div>

      <div className="divider divider-horizontal m-0"></div>

      {/* Alignment Group */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={state.isAlignLeft}
          title="Align Left"
        >
          ⬅
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={state.isAlignCenter}
          title="Align Center"
        >
          ↔
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={state.isAlignRight}
          title="Align Right"
        >
          ➡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={state.isAlignJustify}
          title="Justify"
        >
          ⬌
        </ToolbarButton>
      </div>

      <div className="divider divider-horizontal m-0"></div>

      {/* Lists */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={state.isBulletList}
          title="Bullet List"
        >
          •••
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={state.isOrderedList}
          title="Numbered List"
        >
          123
        </ToolbarButton>
      </div>

      <div className="divider divider-horizontal m-0"></div>

      {/* Other Actions */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={state.isBlockquote}
          title="Blockquote"
        >
          "
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          —
        </ToolbarButton>
      </div>

      <div className="divider divider-horizontal m-0"></div>

      {/* Undo/Redo */}
      <div className="join">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
          title="Undo"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
          title="Redo"
        >
          ↷
        </ToolbarButton>
      </div>
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';
