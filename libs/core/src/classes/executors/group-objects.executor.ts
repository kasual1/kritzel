import type { KritzelAgenticGroupObjectsAction, KritzelAgenticUngroupObjectsAction } from '../../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { KritzelGroup } from '../objects/group.class';
import { flyToObjects, prepareTopLevelTargets } from './select.executor';
import { applyZIndexUpdates } from './order-objects.executor';
import { assertObjectIds, uniqueIds } from '../../helpers/agentic-validation.helper';
import { unionCenter } from '../../helpers/agentic-geometry.helper';
import { KritzelZOrderHelper } from '../../helpers/z-order.helper';

/**
 * `groupObjects`: clicks the objects one after the other, so the selection builds up like shift-clicking them, and
 * groups them. The group becomes one layer at the topmost object, like `editor.group()`.
 */
export const groupObjectsExecutor: KritzelAgenticActionExecutor<KritzelAgenticGroupObjectsAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
    if (uniqueIds(action.objectIds).length < 2) {
      throw new TypeError('"objectIds" must name at least two different objects.');
    }
  },

  prepare(run, action) {
    return prepareTopLevelTargets(run, action.objectIds);
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    const map = run.map!;
    const core = run.core;

    run.display([]);
    for (let index = 0; index < ids.length; index++) {
      const object = map.findById(ids[index]);
      const center = object && unionCenter([object]);
      if (!center) {
        run.stop('object-removed', [ids[index]]);
      }
      await run.fly(center);
      await run.click();
      run.display(ids.slice(0, index + 1));
    }

    const group = run.mutate(() => {
      const { objects, items } = KritzelZOrderHelper.collect(map.allObjects());
      // Top-level objects are grouped at the top level.
      const plan = KritzelZOrderHelper.planGroup(items, ids);
      if (!plan || plan.parentId !== null) {
        return null;
      }
      const created = run.own(KritzelGroup.createFromObjects(core, plan.childIds.map(id => objects.get(id)!)));
      if (plan.groupZIndex !== null) {
        created.zIndex = plan.groupZIndex;
      }
      core.addObject(created);
      applyZIndexUpdates(run, plan.updates);
      return created;
    });
    if (!group) {
      run.stop('invalid-target', ids);
    }

    run.track(group);
    run.display([group.id]);
    run.replaceInSelection(new Map(ids.map(id => [id, [group.id]])));
    return [group.id];
  },
};

/** `ungroupObjects`: clicks the groups and dissolves them; their children keep their place in the stacking order. */
export const ungroupObjectsExecutor: KritzelAgenticActionExecutor<KritzelAgenticUngroupObjectsAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, action.objectIds);
    if ('reason' in preparation) {
      return preparation;
    }
    const notGroups = preparation.targetIds.filter(id => !(run.map!.findById(id) instanceof KritzelGroup));
    return notGroups.length > 0 ? { reason: 'invalid-target', objectIds: notGroups } : preparation;
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    const map = run.map!;
    await flyToObjects(run, ids);
    await run.click();

    const childrenByGroup = new Map<string, string[]>();
    run.mutate(() => {
      const { items } = KritzelZOrderHelper.collect(map.allObjects());
      // Children that share a z-index get distinct ones, so they keep their order without the group.
      const updates = KritzelZOrderHelper.planUngroup(items, ids);
      for (const id of ids) {
        const group = map.findById(id) as KritzelGroup | null;
        if (!group) {
          run.stop('object-removed', [id]);
        }
        childrenByGroup.set(id, [...group.childIds]);
        run.removedSnapshots.set(id, group);
        run.core.removeObject(group, true);
      }
      applyZIndexUpdates(run, updates);
    });
    run.untrack(ids);

    const children = Array.from(childrenByGroup.values()).flat();
    run.display(children);
    run.replaceInSelection(childrenByGroup);
    return children;
  },
};
