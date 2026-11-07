import type { KritzelAgenticAddObjectAction } from '../../../interfaces/agentic-action.interface';
import { KritzelBaseObject } from '../../objects/base-object.class';
import { KritzelGroup } from '../../objects/group.class';
import { KritzelImage } from '../../objects/image.class';
import { KritzelText } from '../../objects/text.class';
import { AGENTIC_ACTION_MOUNT_WAIT_FRAMES, type KritzelAgenticActionExecutor } from './agentic-action.types';
import { isSelectionObject } from './agentic-conflict.helper';
import { unionCenter } from './agentic-geometry.helper';

/**
 * `addObject`: places an object the app built (an iframe, an image, a custom object, a group with
 * children). The cursor hops to where the object will appear and presses, then the object and its
 * group children are inserted as one step of the agent's history. The user's selection stays.
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
    if (object instanceof KritzelImage) {
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
    if (center) {
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

    run.finalAttachment = { objectId: object.id, anchor: 'bottom-right' };
    return [object.id];
  },
};

/**
 * IDs of what can't be inserted: an instance that is already on the canvas, as the object or as a pending child
 * (the insert would give it a new ID and leave it under two), and a group, at any level, whose children were
 * inserted before (it has none left to insert).
 */
function findUninsertable(map: { findById(id: string): unknown }, object: KritzelBaseObject<any>): string[] {
  return [object, ...pendingDescendants(object)]
    .filter(item => map.findById(item.id) === item || (item instanceof KritzelGroup && item._pendingChildren.length === 0 && item.childIds.length > 0))
    .map(item => item.id);
}

/** The children a group will insert with it, at all nesting levels. */
function pendingDescendants(object: KritzelBaseObject<any>): KritzelBaseObject<any>[] {
  if (!(object instanceof KritzelGroup)) {
    return [];
  }
  return object._pendingChildren.flatMap(child => [child, ...pendingDescendants(child)]);
}
