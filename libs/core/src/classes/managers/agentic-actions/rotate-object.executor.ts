import type { KritzelAgenticRotateObjectAction } from '../../../interfaces/agentic-action.interface';
import type { KritzelAgenticCursorObjectTarget } from '../../../interfaces/agentic-cursor.interface';
import { AGENTIC_ACTION_ROTATE_SPEED, AGENTIC_ACTION_ROTATION_HANDLE_PX, type KritzelAgenticActionExecutor } from './agentic-action.types';
import { prepareTopLevelTargets } from './select.executor';
import { assertObjectId } from './agentic-validation.helper';
import { createTransientSelectionGroup, targetRotation } from './agentic-transform.helper';

/** `rotateObject`: grabs the rotation handle and turns the object to the new angle. */
export const rotateObjectExecutor: KritzelAgenticActionExecutor<KritzelAgenticRotateObjectAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    if (typeof action.angle !== 'number' || !Number.isFinite(action.angle)) {
      throw new TypeError('"angle" must be a number of degrees.');
    }
    if (action.relative !== undefined && typeof action.relative !== 'boolean') {
      throw new TypeError('"relative" must be a boolean.');
    }
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, [action.objectId]);
    if ('reason' in preparation) {
      return preparation;
    }
    const object = run.map!.findById(action.objectId)!;
    if (!run.core.objectConfigManager.isRotatable(object)) {
      return { reason: 'not-allowed', objectIds: [action.objectId] };
    }
    return { ...preparation, includeAnchoredLines: true };
  },

  async execute(run, action) {
    const id = action.objectId;
    const map = run.map!;
    const core = run.core;
    const cursors = run.cursorManager;

    const object = map.findById(id);
    if (!object) {
      run.stop('object-removed', [id]);
    }
    const start = object.rotation ?? 0;
    const target = targetRotation(start, action.angle, !!action.relative);
    const delta = target - start;

    // The rotation handle sits above the top edge and turns with the object.
    // (Approximate when a titlebar is shown: the engine moves the handle above it.)
    const handleTarget = (): KritzelAgenticCursorObjectTarget => ({
      objectId: id,
      anchor: 'top',
      offset: { x: 0, y: -AGENTIC_ACTION_ROTATION_HANDLE_PX / (core.store.state.scale || 1) },
    });

    const group = createTransientSelectionGroup(core, [id]);
    group.beginTransform();

    const handlePoint = cursors.resolveTarget(handleTarget());
    if (!handlePoint) {
      run.stop('object-removed', [id]);
    }
    await run.fly(handlePoint);
    await run.press();

    const degrees = Math.abs((delta * 180) / Math.PI);
    await run.animate(
      run.phaseDuration(degrees, AGENTIC_ACTION_ROTATE_SPEED, 300, 1500),
      (eased, _raw, isLast) => {
        run.mutate(() => group.rotate(start + delta * eased), isLast ? 'final' : 'throttled');
        const point = cursors.resolveTarget(handleTarget());
        if (point) {
          cursors.setPosition(run.cursorId, point);
        }
      },
      run.options.easing ?? 'ease-in-out',
    );

    await run.release();
    run.changedProperties.set(id, ['rotation', 'translateX', 'translateY']);
    run.finalAttachment = handleTarget();
    return [id];
  },
};
