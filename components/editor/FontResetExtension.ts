import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Extension that resets inline font styling when creating new block elements
 * or converting between block types (e.g., paragraph → blockquote).
 * This ensures elements inherit the book's configured default fonts.
 */
export const FontReset = Extension.create({
  name: 'fontReset',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('fontReset'),
        appendTransaction: (transactions, _oldState, newState) => {
          const tr = newState.tr;
          let modified = false;

          // Detect if this transaction involves node type changes or splits
          let hasNodeTypeChange = false;
          let hasSplit = false;

          transactions.forEach((transaction) => {
            transaction.steps.forEach((step) => {
              // @ts-ignore - Check for setNodeMarkup (node type changes)
              if (step.jsonID === 'setNodeMarkup') {
                hasNodeTypeChange = true;
              }
              // @ts-ignore - Check for replace steps (splits, new nodes)
              if (step.jsonID === 'replace' || step.jsonID === 'replaceAround') {
                // @ts-ignore
                if (step.slice && step.slice.content && step.slice.content.childCount > 0) {
                  hasSplit = true;
                }
              }
            });
          });

          // Only proceed if we detected relevant changes
          if (!hasNodeTypeChange && !hasSplit) {
            return null;
          }

          // Clear font-family marks from all block-level nodes
          newState.doc.descendants((node, pos) => {
            // Only process block nodes (paragraph, heading, blockquote)
            if (!node.isBlock || node.type.name === 'doc') {
              return true;
            }

            // Check if this block has any text with font-family marks
            node.descendants((child, childPos) => {
              if (child.isText && child.marks.length > 0) {
                const hasFontFamily = child.marks.some(
                  (mark) => mark.type.name === 'textStyle' && mark.attrs.fontFamily
                );

                if (hasFontFamily) {
                  const absolutePos = pos + childPos + 1;
                  // Remove only the fontFamily attribute from textStyle
                  const textStyleMark = newState.schema.marks.textStyle;
                  if (textStyleMark) {
                    tr.removeMark(
                      absolutePos,
                      absolutePos + child.nodeSize,
                      textStyleMark
                    );
                    modified = true;
                  }
                }
              }
            });

            return true;
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
