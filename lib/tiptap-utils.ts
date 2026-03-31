/**
 * Extracts plain text from a TipTap JSON document.
 * Recursively walks the node tree, emitting text content and
 * skipping non-textual nodes like media anchors.
 */
export function extractPlainText(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';

  const node = doc as { type?: string; text?: string; content?: unknown[] };

  // Text leaf node
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  // No children to recurse into
  if (!Array.isArray(node.content) || node.content.length === 0) {
    // Horizontal rule produces a line break
    if (node.type === 'horizontalRule') return '\n';
    return '';
  }

  // Skip non-textual nodes
  if (node.type === 'mediaAnchor') return '';

  // Block-level nodes that produce line breaks after their content
  const blockTypes = new Set([
    'doc', 'paragraph', 'heading', 'blockquote', 'listItem',
    'bulletList', 'orderedList', 'codeBlock',
  ]);

  const childTexts = node.content
    .map((child) => extractPlainText(child))
    .filter((t) => t.length > 0);

  if (blockTypes.has(node.type || '')) {
    const joined = childTexts.join(' ');
    // doc is the root — don't add trailing newline
    if (node.type === 'doc') return joined;
    return joined + '\n';
  }

  // Inline nodes (marks, etc.) — join without separator
  return childTexts.join('');
}
