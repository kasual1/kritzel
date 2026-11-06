import type { KritzelAgenticAddObjectAction } from '../../../interfaces/agentic-action.interface';
import { KritzelBaseObject } from '../../objects/base-object.class';
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
    // The same instance can't be inserted twice.
    if (run.map!.findById(action.object.id) === action.object) {
      return { reason: 'invalid-target', objectIds: [action.object.id] };
    }
    return { targetIds: [], referenceIds: [] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const object = action.object;

    object._core = core;
    object.scale = object.scale ?? core.store.state.scale;
    if (object instanceof KritzelImage) {
      // Fetches and stores the image; a failure rejects the action.
      await object.prepareForInsert();
      run.assertActive();
    }

    const descendants = core.prepareObjectForInsert(object);
    const all = [...descendants, object];
    const center = unionCenter(descendants.length > 0 ? descendants : [object]);
    if (center) {
      await run.fly(center);
    }
    await run.press();

    run.mutate(() => {
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
