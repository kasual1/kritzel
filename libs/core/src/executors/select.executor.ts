import type { KritzelAgenticClearSelectionAction, KritzelAgenticSelectAction } from '../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor, KritzelAgenticPreparation, KritzelAgenticRefusal } from './agentic-action.types';
import type { KritzelAgenticActionRun } from '../classes/managers/agentic-action-run.class';
import { isSelectionObject, isTopLevel } from '../helpers/agentic-conflict.helper';
import { unionCenter } from '../helpers/agentic-geometry.helper';
import { assertObjectIds, uniqueIds } from '../helpers/agentic-validation.helper';

/**
 * Checks that every ID is an existing top-level object that is not a selection.
 * Shared by the actions that take top-level object IDs.
 */
export function prepareTopLevelTargets(run: KritzelAgenticActionRun, ids: string[]): KritzelAgenticPreparation | KritzelAgenticRefusal {
  const map = run.map!;
  const unique = uniqueIds(ids);
  for (const id of unique) {
    const object = map.findById(id);
    if (!object || isSelectionObject(object) || !isTopLevel(map, id)) {
      return { reason: 'invalid-target', objectIds: [id] };
    }
  }
  return { targetIds: unique, referenceIds: [] };
}

/** Flies to the center of the objects. */
export async function flyToObjects(run: KritzelAgenticActionRun, ids: string[]): Promise<void> {
  const map = run.map!;
  const objects = ids.map(id => map.findById(id)).filter((object): object is NonNullable<typeof object> => !!object);
  const center = unionCenter(objects);
  if (!center) {
    run.stop('object-removed', ids);
  }
  await run.fly(center);
}

/** `select`: clicks the objects and makes them this agent's selection. Shared with collaborators only as presence. */
export const selectExecutor: KritzelAgenticActionExecutor<KritzelAgenticSelectAction> = {
  mutates: false,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
    if (action.additive !== undefined && typeof action.additive !== 'boolean') {
      throw new TypeError('"additive" must be a boolean.');
    }
  },

  prepare(run, action) {
    return prepareTopLevelTargets(run, action.objectIds);
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    await flyToObjects(run, ids);
    await run.click();
    // The run may have been stopped (e.g. cursor removed) while the click finished.
    run.assertActive();
    const next = action.additive ? uniqueIds([...run.host.getSelection(run.cursorId), ...ids]) : ids;
    run.host.setSelection(run.cursorId, next);
    return next;
  },
};

/** `clearSelection`: clears this agent's selection. */
export const clearSelectionExecutor: KritzelAgenticActionExecutor<KritzelAgenticClearSelectionAction> = {
  mutates: false,

  validate() {
    // Nothing to validate.
  },

  prepare() {
    return { targetIds: [], referenceIds: [] };
  },

  async execute(run) {
    run.host.setSelection(run.cursorId, []);
    return [];
  },
};
