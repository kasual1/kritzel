import { Selection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

/** Programmatic editing of the ProseMirror documents of text and shape objects. */
export class KritzelRichTextHelper {
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

  /** The plain text of the document. */
  static getText(view: EditorView): string {
    return view.state.doc.textContent;
  }
}
