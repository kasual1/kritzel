import type { KritzelAgenticMoveObjectAction } from '../../../interfaces/agentic-action.interface';
import { KritzelLine } from '../../objects/line.class';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import { isSelectionObject } from './agentic-conflict.helper';
import { prepareTopLevelTargets } from './select.executor';
import { assertAnchor, assertObjectId, assertTarget, isObjectTarget } from './agentic-validation.helper';

/** `moveObject`: grabs the object, drags it so its `align` point lands on `to`, and releases it. */
export const moveObjectExecutor: KritzelAgenticActionExecutor<KritzelAgenticMoveObjectAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    assertTarget(action.to, 'to');
    assertAnchor(action.align, 'align');
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, [action.objectId]);
    if ('reason' in preparation) {
      return preparation;
    }
    if (isObjectTarget(action.to)) {
      const reference = run.map!.findById(action.to.objectId);
      if (!reference || isSelectionObject(reference) || action.to.objectId === action.objectId) {
        return { reason: 'invalid-target', objectIds: [action.to.objectId] };
      }
      return { ...preparation, referenceIds: [action.to.objectId], includeAnchoredLines: true };
    }
    return { ...preparation, includeAnchoredLines: true };
  },

  async execute(run, action) {
    const id = action.objectId;
    const map = run.map!;
    const cursors = run.cursorManager;
    const core = run.core;

    const grip = cursors.resolveTarget({ objectId: id, anchor: 'center' });
    if (!grip) {
      run.stop('object-removed', [id]);
    }
    await run.fly(grip);
    await run.press();

    const alignPoint = cursors.resolveTarget({ objectId: id, anchor: action.align ?? 'center' });
    const destination = cursors.resolveTarget(action.to);
    if (!alignPoint || !destination) {
      run.stop('object-removed', [id]);
    }
    const total = { x: destination.x - alignPoint.x, y: destination.y - alignPoint.y };

    // Dragging a whole anchored line detaches it, like the move handler does.
    const object = map.findById(id);
    if (object instanceof KritzelLine && (object.startAnchor || object.endAnchor)) {
      const line = object;
      run.mutate(() => {
        if (line.startAnchor) core.anchorManager.removeAnchor(id, 'start');
        if (line.endAnchor) core.anchorManager.removeAnchor(id, 'end');
        // Persist the detach so it is recorded (and rolled back on abort) like every other agent change.
        map.update(line);
      });
    }

    const scale = core.store.state.scale || 1;
    const duration = run.dragDuration(Math.hypot(total.x, total.y) * scale);
    let applied = { x: 0, y: 0 };

    await run.animate(
      duration,
      (eased, _raw, isLast) => {
        const delta = { x: total.x * eased, y: total.y * eased };
        const step = { x: delta.x - applied.x, y: delta.y - applied.y };
        run.mutate(() => {
          const current = map.findById(id);
          if (!current) {
            return;
          }
          // move() takes screen deltas and divides by the viewport scale.
          const viewportScale = core.store.state.scale || 1;
          current.move(step.x * viewportScale, step.y * viewportScale, 0, 0);
          core.anchorManager.updateAnchorsForObject(id);
        }, isLast ? 'final' : 'throttled');
        applied = delta;
        cursors.setPosition(run.cursorId, { x: grip.x + delta.x, y: grip.y + delta.y });
      },
      run.options.easing ?? 'ease-in-out',
    );

    await run.release();
    run.changedProperties.set(id, ['translateX', 'translateY']);
    run.finalAttachment = { objectId: id, anchor: 'center' };
    return [id];
  },
};
