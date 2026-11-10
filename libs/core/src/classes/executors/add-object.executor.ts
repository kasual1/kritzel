import type { KritzelAgenticAddObjectAction, KritzelAgenticFill } from '../../interfaces/agentic-action.interface';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelText } from '../objects/text.class';
import { AGENTIC_ACTION_MOUNT_WAIT_FRAMES } from '../../constants/agentic-action.constants';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import type { KritzelAgenticActionRun } from '../managers/agentic-action-run.class';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { unionCenter } from '../../helpers/agentic-geometry.helper';

/**
 * `addObject`: places an object the app built (an iframe, an image, a custom object, a group with
 * children). The cursor hops to where the object will appear and presses, then the object and its
 * group children are inserted as one step of the agent's history. The user's selection stays.
 *
 * With `fill`, the object is a loading placeholder: the action stays open until the fill arrives and then fills
 * the placeholder in, so placing and filling are one step of the history, and a stop rolls both back.
 */
export const addObjectExecutor: KritzelAgenticActionExecutor<KritzelAgenticAddObjectAction> = {
  mutates: true,

  validate(action) {
    if (!(action.object instanceof KritzelBaseObject)) {
      throw new TypeError('"object" must be a Kritzel object, e.g. new KritzelShape({ ... }).');
    }
    if (isSelectionObject(action.object)) {
      throw new TypeError('"object" can\'t be a selection.');
    }
    if (action.fill !== undefined) {
      if (typeof (action.fill as Promise<unknown> | null)?.then !== 'function') {
        throw new TypeError('"fill" must be a promise.');
      }
      if (action.object instanceof KritzelGroup) {
        throw new TypeError('A group can\'t be a placeholder.');
      }
    }
  },

  prepare(run, action) {
    const refused = findUninsertable(run.map!, action.object);
    return refused.length > 0 ? { reason: 'invalid-target', objectIds: refused } : { targetIds: [], referenceIds: [] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const object = action.object;

    // Nothing but the scale (which the insert would set the same way) changes before the insert: a group with a
    // core would, for example, stop collecting the children added to it later.
    object.scale = object.scale ?? core.store.state.scale;
    if (action.fill) {
      object.isLoading = true;
    } else if (object instanceof KritzelImage) {
      // Fetches and stores the image; a failure rejects the action.
      object._core = core;
      await object.prepareForInsert();
      run.assertActive();
    }

    // The cursor only needs the geometry: IDs, z-index and group children are assigned at the insert, so an
    // action that stops before it leaves the app's object as it was, and the z-index is the current one.
    const leaves = pendingDescendants(object).filter(child => !(child instanceof KritzelGroup));
    leaves.forEach(child => (child.scale = child.scale ?? core.store.state.scale));
    const center = unionCenter(leaves.length > 0 ? leaves : [object]);
    // An object without a position presses where the cursor is.
    if (center && Number.isFinite(center.x) && Number.isFinite(center.y)) {
      await run.fly(center);
    }
    await run.press();

    // The app (or another agent) may have inserted the same instance while the cursor flew.
    const refused = findUninsertable(map, object);
    if (refused.length > 0) {
      run.stop('invalid-target', refused);
    }
    let all: KritzelBaseObject<any>[] = [];
    run.mutate(() => {
      const descendants = core.prepareObjectForInsert(object);
      all = [...descendants, object];
      all.forEach(item => run.own(item));
      core.insertPreparedObject(object, descendants);
    });
    all.forEach(item => run.track(item));
    await run.release();

    // Wait for an on-screen object to mount (texts measure themselves then), like engine.addObject().
    if (object.isInViewport()) {
      core.rerender();
      for (let frame = 0; frame < AGENTIC_ACTION_MOUNT_WAIT_FRAMES && !map.findById(object.id)?.isMounted; frame++) {
        await run.nextRenderedFrame();
      }
      const texts = all.filter((item): item is KritzelText => item instanceof KritzelText && item.isMounted);
      if (texts.length > 0) {
        run.mutate(() => {
          texts.forEach(text => {
            text.adjustSizeOnInput();
            map.update(text);
          });
        });
      }
    }

    if (action.fill) {
      await fillPlaceholder(run, object, action.fill);
    }

    run.finalAttachment = { objectId: object.id, anchor: 'bottom-right' };
    return [object.id];
  },
};

/** Waits for the fill of a placeholder the action placed, then fills it in and ends its loading. */
async function fillPlaceholder(run: KritzelAgenticActionRun, placeholder: KritzelBaseObject<any>, fill: Promise<KritzelAgenticFill>): Promise<void> {
  // While it waits, the placeholder is the user's to move, resize or delete: it is no longer checked.
  run.untrack([placeholder.id]);
  let filling: KritzelAgenticFill;
  try {
    filling = await fill;
  } catch {
    run.assertActive();
    run.stop('aborted');
  }
  run.assertActive();
  const { content, apply } = filling;
  if (content instanceof KritzelImage) {
    // Fetches and stores the image; a failure rejects the action.
    content._core = run.core;
    await content.prepareForInsert();
    run.assertActive();
  }
  const map = run.map!;
  // The live instance: the user may have changed the placeholder meanwhile.
  const current = map.findById(placeholder.id);
  if (!current) {
    run.stop('object-removed', [placeholder.id]);
  }
  run.mutate(() => {
    apply(current, content);
    current.isLoading = false;
    map.update(current);
  });
}

/**
 * IDs of what can't be inserted:
 * - an instance that is already on the canvas, as the object or as a pending child (the insert would give it a
 *   new ID and leave it under two), or that the group tree holds twice;
 * - a group, at any level, without pending children: an empty one has no geometry, and one whose children were
 *   inserted before has none left to insert.
 */
function findUninsertable(map: { findById(id: string): unknown }, object: KritzelBaseObject<any>): string[] {
  const seen = new Set<KritzelBaseObject<any>>();
  const refused: string[] = [];
  for (const item of [object, ...pendingDescendants(object)]) {
    const duplicate = seen.has(item);
    seen.add(item);
    if (duplicate || map.findById(item.id) === item || (item instanceof KritzelGroup && item._pendingChildren.length === 0)) {
      refused.push(item.id);
    }
  }
  return Array.from(new Set(refused));
}

/** The children a group will insert with it, at all nesting levels. A group that contains itself is walked once. */
export function pendingDescendants(object: KritzelBaseObject<any>, visited = new Set<KritzelBaseObject<any>>()): KritzelBaseObject<any>[] {
  if (!(object instanceof KritzelGroup) || visited.has(object)) {
    return [];
  }
  visited.add(object);
  return object._pendingChildren.flatMap(child => [child, ...pendingDescendants(child, visited)]);
}
