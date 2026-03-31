// Tiptap JSON content types

export interface TiptapTextNode {
  type: 'text';
  text: string;
  marks?: Array<{
    type: 'bold' | 'italic' | 'strike' | 'code';
    attrs?: Record<string, unknown>;
  }>;
}

export interface TiptapParagraphNode {
  type: 'paragraph';
  attrs?: {
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    marginTop?: number;
    marginBottom?: number;
  };
  content?: TiptapContentNode[];
}

export interface TiptapHeadingNode {
  type: 'heading';
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  content?: TiptapContentNode[];
}

export interface TiptapMediaAnchorNode {
  type: 'mediaAnchor';
  attrs: {
    id: string;
    kind: 'IMAGE' | 'AUDIO';
  };
}

export interface TiptapBulletListNode {
  type: 'bulletList';
  content?: TiptapListItemNode[];
}

export interface TiptapOrderedListNode {
  type: 'orderedList';
  content?: TiptapListItemNode[];
}

export interface TiptapListItemNode {
  type: 'listItem';
  content?: TiptapContentNode[];
}

export interface TiptapBlockquoteNode {
  type: 'blockquote';
  content?: TiptapContentNode[];
}

export interface TiptapHorizontalRuleNode {
  type: 'horizontalRule';
}

export type TiptapContentNode =
  | TiptapTextNode
  | TiptapParagraphNode
  | TiptapHeadingNode
  | TiptapMediaAnchorNode
  | TiptapBulletListNode
  | TiptapOrderedListNode
  | TiptapListItemNode
  | TiptapBlockquoteNode
  | TiptapHorizontalRuleNode;

export interface TiptapDocument {
  type: 'doc';
  content?: TiptapContentNode[];
}

export interface BookStyleConfig {
  h1Font?: string;
  h2Font?: string;
  h3Font?: string;
  bodyFont?: string;
  defaultMargin?: number;
  centeredPadding?: number;
}
