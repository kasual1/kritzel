import type { KritzelAgenticUpdateIframeAction } from '../../interfaces/agentic-action.interface';
import { KritzelIframeObject } from '../objects/iframe.class';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { assertObjectId } from '../../helpers/agentic-validation.helper';

const CONTENT_FIELDS = ['html', 'css', 'script'] as const;

/** `updateIframe`: clicks an iframe and replaces parts of its code and its name, as one step of the history. */
export const updateIframeExecutor: KritzelAgenticActionExecutor<KritzelAgenticUpdateIframeAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    for (const field of ['name', ...CONTENT_FIELDS] as const) {
      if (action[field] !== undefined && typeof action[field] !== 'string') {
        throw new TypeError(`"${field}" must be a string.`);
      }
    }
    if (action.name !== undefined && action.name.trim() === '') {
      throw new TypeError('"name" must not be empty.');
    }
    if (action.name === undefined && CONTENT_FIELDS.every(field => action[field] === undefined)) {
      throw new TypeError('Give at least one of "name", "html", "css" or "script".');
    }
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

    const changed: string[] = [];
    run.mutate(() => {
      const found = run.map!.findById(id);
      const iframe = found instanceof KritzelIframeObject ? found : run.stop('object-removed', [id]);
      if (action.name !== undefined) {
        iframe.name = action.name;
        iframe.title = action.name;
        changed.push('name', 'title');
      }
      const content = Object.fromEntries(CONTENT_FIELDS.filter(field => action[field] !== undefined).map(field => [field, action[field]]));
      if (Object.keys(content).length > 0) {
        // Also reloads the mounted iframe with the new code.
        iframe.setContent(content);
        changed.push('content');
      }
      run.map!.update(iframe);
    });
    run.changedProperties.set(id, changed);
    run.finalAttachment = { objectId: id, anchor: 'center' };
    return [id];
  },
};
