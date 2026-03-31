import { Node, mergeAttributes } from '@tiptap/core';

export interface ParagraphOptions {
  HTMLAttributes: Record<string, unknown>;
}

export const ParagraphWithMargins = Node.create<ParagraphOptions>({
  name: 'paragraph',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      textAlign: {
        default: 'left',
        parseHTML: (element) => element.style.textAlign || 'left',
        renderHTML: (attributes) => {
          if (attributes.textAlign === 'left') {
            return {};
          }
          return {
            style: `text-align: ${attributes.textAlign}`,
          };
        },
      },
      marginTop: {
        default: 0,
        parseHTML: (element) => {
          const margin = element.style.marginTop;
          return margin ? parseInt(margin, 10) : 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.marginTop && !attributes.marginBottom) {
            return {};
          }
          const styles: string[] = [];
          if (attributes.marginTop) {
            styles.push(`margin-top: ${attributes.marginTop}px`);
          }
          if (attributes.marginBottom) {
            styles.push(`margin-bottom: ${attributes.marginBottom}px`);
          }
          return {
            style: styles.join('; '),
          };
        },
      },
      marginBottom: {
        default: 0,
        parseHTML: (element) => {
          const margin = element.style.marginBottom;
          return margin ? parseInt(margin, 10) : 0;
        },
        renderHTML: () => {
          // Rendered together with marginTop
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
    };
  },
});
