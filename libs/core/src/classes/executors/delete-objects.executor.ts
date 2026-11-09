import type { KritzelAgenticDeleteObjectsAction } from '../../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { collectWithDescendants } from '../../helpers/agentic-conflict.helper';
import { flyToObjects, prepareTopLevelTargets } from './select.executor';
import { assertObjectIds, uniqueIds } from '../../helpers/agentic-validation.helper';

/** `deleteObjects`: clicks the objects and deletes them (group children go with their group). */
export const deleteObjectsExecutor: KritzelAgenticActionExecutor<KritzelAgenticDeleteObjectsAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, action.objectIds);
    if ('reason' in preparation) {
      return preparation;
    }
    return { ...preparation, includeAnchoredLines: true };
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    const map = run.map!;
    await flyToObjects(run, ids);
    await run.click();

    // Targets are top-level, so the deleted set is the targets plus their group descendants.
    const deleted = collectWithDescendants(map, ids);
    deleted.forEach(id => {
      const object = map.findById(id);
      if (object) {
        run.removedSnapshots.set(id, object);
      }
    });

    run.untrack(deleted);
    run.mutate(() => {
      for (const id of ids) {
        const object = map.findById(id);
        if (object) {
          run.core.removeObject(object);
        }
      }
    });
    // A listener may have stopped the run during the deletion; then its rollback restores the objects.
    run.assertActive();

    const selection = run.selection.get();
    const remaining = selection.filter(id => !deleted.has(id));
    if (remaining.length !== selection.length) {
      run.selection.set(remaining);
    }
    return ids;
  },
};
