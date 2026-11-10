import type { KritzelAgenticIframeChanges, KritzelAgenticUpdateIframeAction } from '../../interfaces/agentic-action.interface';
import { KritzelIframeObject } from '../objects/iframe.class';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { assertObjectId } from '../../helpers/agentic-validation.helper';

const CONTENT_FIELDS = ['html', 'css', 'script'] as const;

/** Throws for changes that are not strings, an empty name, or (unless `allowEmpty`) no change at all. */
function validateChanges(changes: KritzelAgenticIframeChanges, allowEmpty: boolean): void {
  for (const field of ['name', ...CONTENT_FIELDS] as const) {
    if (changes[field] !== undefined && typeof changes[field] !== 'string') {
      throw new TypeError(`"${field}" must be a string.`);
    }
  }
  if (changes.name !== undefined && changes.name.trim() === '') {
    throw new TypeError('"name" must not be empty.');
  }
  if (!allowEmpty && changes.name === undefined && CONTENT_FIELDS.every(field => changes[field] === undefined)) {
    throw new TypeError('Give at least one of "name", "html", "css" or "script".');
  }
}

/**
 * `updateIframe`: clicks an iframe and replaces parts of its code and its name, as one step of the history. With
 * `fill`, the iframe shows as loading until the changes arrive.
 */
export const updateIframeExecutor: KritzelAgenticActionExecutor<KritzelAgenticUpdateIframeAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    if (action.fill !== undefined && typeof action.fill !== 'function') {
      throw new TypeError('"fill" must be a function.');
    }
    validateChanges(action, action.fill !== undefined);
  },

  prepare(run, action) {
    const object = run.map!.findById(action.objectId);
    if (!object || isSelectionObject(object) || !(object instanceof KritzelIframeObject)) {
      return { reason: 'invalid-target', objectIds: [action.objectId] };
    }
    return { targetIds: [action.objectId], referenceIds: [] };
  },

  async execute(run, action) {
    const id = action.objectId;
    const point = run.cursorManager.resolveTarget({ objectId: id, anchor: 'center' });
    if (!point) {
      run.stop('object-removed', [id]);
    }
    await run.fly(point);
    await run.click();

    const map = run.map!;
    const liveIframe = () => {
      const found = map.findById(id);
      return found instanceof KritzelIframeObject ? found : run.stop('object-removed', [id]);
    };

    let changes: KritzelAgenticIframeChanges = action;
    if (action.fill) {
      run.mutate(() => {
        const iframe = liveIframe();
        iframe.isLoading = true;
        map.update(iframe);
      });
      try {
        changes = await action.fill();
        validateChanges(changes, false);
        if (changes.objectId !== id) {
          throw new TypeError('The changes are for another iframe.');
        }
      } catch {
        run.assertActive();
        run.stop('aborted');
      }
      run.assertActive();
    }

    const changed: string[] = [];
    run.mutate(() => {
      const iframe = liveIframe();
      if (changes.name !== undefined) {
        iframe.name = changes.name;
        iframe.title = changes.name;
        changed.push('name', 'title');
      }
      const content = Object.fromEntries(CONTENT_FIELDS.filter(field => changes[field] !== undefined).map(field => [field, changes[field]]));
      if (Object.keys(content).length > 0) {
        // Also reloads the mounted iframe with the new code.
        iframe.setContent(content);
        changed.push('content');
      }
      if (action.fill) {
        iframe.isLoading = false;
      }
      map.update(iframe);
    });
    run.changedProperties.set(id, changed);
    run.finalAttachment = { objectId: id, anchor: 'center' };
    return [id];
  },
};
