import type { KritzelAgenticOrderObjectsAction } from '../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import type { KritzelAgenticActionRun } from '../classes/managers/agentic-action-run.class';
import { flyToObjects, prepareTopLevelTargets } from './select.executor';
import { AGENTIC_ORDERS, assertObjectIds, uniqueIds } from '../helpers/agentic-validation.helper';
import { KritzelZOrderHelper } from '../helpers/z-order.helper';

/**
 * Writes planned z-indices under the run's agent origin and records them for `objectsUpdated`. Objects that are
 * gone (e.g. a group the action just dissolved) are skipped. Call it inside `run.mutate()`.
 */
export function applyZIndexUpdates(run: KritzelAgenticActionRun, updates: Map<string, number>): void {
  const map = run.map!;
  updates.forEach((zIndex, id) => {
    const object = map.findById(id);
    if (!object) {
      return;
    }
    object.zIndex = zIndex;
    map.update(object);
    run.changedProperties.set(id, ['zIndex']);
  });
}

/** `orderObjects`: clicks the objects and moves them in the stacking order, like "Bring to front". */
export const orderObjectsExecutor: KritzelAgenticActionExecutor<KritzelAgenticOrderObjectsAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
    if (!AGENTIC_ORDERS.includes(action.order)) {
      throw new TypeError(`"order" must be one of ${AGENTIC_ORDERS.join(', ')}.`);
    }
  },

  prepare(run, action) {
    return prepareTopLevelTargets(run, action.objectIds);
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    await flyToObjects(run, ids);
    await run.click();

    // Planned on the state right before the change; objects already in place change nothing.
    const { items } = KritzelZOrderHelper.collect(run.map!.allObjects());
    const updates = KritzelZOrderHelper.reorder(items, ids, action.order);
    if (updates.size > 0) {
      run.mutate(() => applyZIndexUpdates(run, updates));
    }
    return ids;
  },
};
