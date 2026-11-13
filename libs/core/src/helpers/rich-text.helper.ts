import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/** Programmatic editing of the ProseMirror documents of text and shape objects. */
export class UpdrawRichTextHelper {
  /**
   * Appends text at the end of the document. `\n` starts a new paragraph.
   * Dispatches one transaction, so the object's own change handling (content, size, persistence) runs.
   */
  static appendText(view: EditorView, text: string): void {
    if (!text) {
      return;
    }
    let tr = view.state.tr;
    text.split('\n').forEach((part, index) => {
      if (index > 0) {
        tr = tr.split(Selection.atEnd(tr.doc).from);
      }
      if (part) {
        tr = tr.insertText(part, Selection.atEnd(tr.doc).from);
      }
    });
    if (tr.docChanged) {
      view.dispatch(tr);
    }
  }

  /** Replaces the document with a single empty paragraph. */
  static clear(view: EditorView): void {
    const { doc, schema } = view.state;
    const paragraph = schema.nodes['paragraph'];
    if (!paragraph) {
      return;
    }
    const tr = view.state.tr.replaceWith(0, doc.content.size, paragraph.create());
    if (tr.docChanged) {
      view.dispatch(tr);
    }
  }

  /** The plain text of the document with a line break between paragraphs and at hard breaks. */
  static getPlainText(view: EditorView): string {
    const { doc } = view.state;
    return doc.textBetween(0, doc.content.size, '\n', '\n');
  }

  /**
   * The plain text of stored ProseMirror JSON (`object.content`), without a schema: text nodes are
   * joined, text blocks are separated by a line break, `hard_break` nodes become line breaks.
   */
  static toPlainText(content: unknown): string {
    const blocks: string[] = [];
    let current = '';
    let hasText = false;

    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') {
        return;
      }
      const { type, text, content: children } = node as { type?: unknown; text?: unknown; content?: unknown };
      if (type === 'text' && typeof text === 'string') {
        current += text;
        hasText = true;
        return;
      }
      if (type === 'hard_break') {
        current += '\n';
        return;
      }
      const isTextBlock = Array.isArray(children) && children.some(child => (child as { type?: unknown })?.type === 'text' || (child as { type?: unknown })?.type === 'hard_break');
      const isBlock = type === 'paragraph' || type === 'heading' || isTextBlock;
      if (isBlock && current) {
        blocks.push(current);
        current = '';
      }
      if (Array.isArray(children)) {
        children.forEach(walk);
      }
      if (isBlock) {
        blocks.push(current);
        current = '';
      }
    };

    walk(content);
    if (current) {
      blocks.push(current);
    }
    return hasText ? blocks.join('\n').replace(/\n+$/, '') : '';
  }
}
