import type { KritzelAgenticTypeTextAction } from '../../interfaces/agentic-action.interface';
import type { EditorView } from 'prosemirror-view';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelRichTextHelper } from '../../helpers/rich-text.helper';
import { AGENTIC_ACTION_TYPING_CPS } from '../../constants/agentic-action.constants';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import type { KritzelAgenticActionRun } from '../managers/agentic-action-run.class';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { assertObjectId } from '../../helpers/agentic-validation.helper';

type TypeableObject = KritzelText | KritzelShape;

function isTypeable(object: unknown): object is TypeableObject {
  return object instanceof KritzelText || object instanceof KritzelShape;
}

function editorOf(run: KritzelAgenticActionRun, objectId: string): { object: TypeableObject; editor: EditorView } {
  const object = run.map!.findById(objectId);
  if (!isTypeable(object) || !object.editor) {
    run.stop('object-removed', [objectId]);
  }
  return { object, editor: object.editor };
}

/**
 * Types `text` into a text or shape character by character. The object's own editor
 * handling updates its content and size; writes go to the agent's history.
 */
export async function typeInto(run: KritzelAgenticActionRun, objectId: string, text: string): Promise<void> {
  const characters = Array.from(text);
  const cursors = run.cursorManager;
  let typed = 0;

  const follow = () => {
    const point = cursors.resolveTarget({ objectId, anchor: 'right' });
    if (point) {
      cursors.setPosition(run.cursorId, point);
    }
  };

  if (characters.length > 0) {
    const duration = (characters.length / (AGENTIC_ACTION_TYPING_CPS * run.speedFactor)) * 1000;
    await run.animate(
      duration,
      (_eased, raw, isLast) => {
        const next = isLast ? characters.length : Math.floor(raw * characters.length);
        if (next > typed) {
          const chunk = characters.slice(typed, next).join('');
          run.mutate(() => KritzelRichTextHelper.appendText(editorOf(run, objectId).editor, chunk), isLast ? 'final' : 'throttled');
          typed = next;
        }
        follow();
      },
      'linear',
    );
  }

  // Measure once more (the DOM has the final text) and persist the final size.
  run.mutate(() => {
    const { object } = editorOf(run, objectId);
    if (object instanceof KritzelText) {
      object.adjustSizeOnInput();
    }
    run.map!.update(object);
  });
  follow();
}

/** `typeText`: clicks into a text or shape and types. */
export const typeTextExecutor: KritzelAgenticActionExecutor<KritzelAgenticTypeTextAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    if (typeof action.text !== 'string') {
      throw new TypeError('"text" must be a string.');
    }
    if (action.mode !== undefined && action.mode !== 'append' && action.mode !== 'replace') {
      throw new TypeError('"mode" must be \'append\' or \'replace\'.');
    }
    if (action.text.length === 0 && action.mode !== 'replace') {
      throw new TypeError('"text" must not be empty.');
    }
  },

  prepare(run, action) {
    const object = run.map!.findById(action.objectId);
    if (!object || isSelectionObject(object) || !isTypeable(object)) {
      return { reason: 'invalid-target', objectIds: [action.objectId] };
    }
    return { targetIds: [action.objectId], referenceIds: [] };
  },

  async execute(run, action) {
    const id = action.objectId;
    const point = run.cursorManager.resolveTarget({ objectId: id, anchor: action.text ? 'right' : 'center' });
    if (!point) {
      run.stop('object-removed', [id]);
    }
    await run.fly(point);
    await run.click();

    if (action.mode === 'replace') {
      run.mutate(() => KritzelRichTextHelper.clear(editorOf(run, id).editor));
    }
    await typeInto(run, id, action.text);

    const { object } = editorOf(run, id);
    run.changedProperties.set(id, object instanceof KritzelText ? ['content', 'width', 'height'] : ['content']);
    run.finalAttachment = { objectId: id, anchor: 'right' };
    return [id];
  },
};
