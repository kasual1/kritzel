import type { UpdrawAgenticResizeObjectAction } from '../../interfaces/agentic-action.interface';
import { UpdrawGroup } from '../objects/group.class';
import type { UpdrawAgenticActionExecutor } from '../../types/agentic-action.types';
import { collectWithDescendants } from '../../helpers/agentic-conflict.helper';
import { prepareTopLevelTargets } from './select.executor';
import { AGENTIC_RESIZE_HANDLES, assertObjectId } from '../../helpers/agentic-validation.helper';
import { computeAnchoredResize, createTransientSelectionGroup, fixedCorner } from '../../helpers/agentic-transform.helper';

function assertPositiveSize(value: unknown, field: string): void {
  if (value !== undefined && !(typeof value === 'number' && Number.isFinite(value) && value > 0)) {
    throw new TypeError(`"${field}" must be a positive number.`);
  }
}

/** `resizeObject`: grabs a corner handle and drags it until the object has the new size. */
export const resizeObjectExecutor: UpdrawAgenticActionExecutor<UpdrawAgenticResizeObjectAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.objectId, 'objectId');
    assertPositiveSize(action.width, 'width');
    assertPositiveSize(action.height, 'height');
    if (action.width === undefined && action.height === undefined) {
      throw new TypeError('"width" or "height" is required.');
    }
    if (action.keepAspectRatio !== undefined && typeof action.keepAspectRatio !== 'boolean') {
      throw new TypeError('"keepAspectRatio" must be a boolean.');
    }
    if (action.handle !== undefined && !AGENTIC_RESIZE_HANDLES.includes(action.handle)) {
      throw new TypeError(`"handle" must be one of ${AGENTIC_RESIZE_HANDLES.join(', ')}.`);
    }
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, [action.objectId]);
    if ('reason' in preparation) {
      return preparation;
    }
    const object = run.map!.findById(action.objectId)!;
    if (!run.core.objectConfigManager.isResizable(object)) {
      return { reason: 'not-allowed', objectIds: [action.objectId] };
    }
    return { ...preparation, includeAnchoredLines: true };
  },

  async execute(run, action) {
    const id = action.objectId;
    const map = run.map!;
    const core = run.core;
    const cursors = run.cursorManager;
    const handle = action.handle ?? 'bottom-right';

    const object = map.findById(id);
    if (!object) {
      run.stop('object-removed', [id]);
    }
    const box = object.boundingBox;
    let factorX = action.width !== undefined ? action.width / box.width : 1;
    let factorY = action.height !== undefined ? action.height / box.height : 1;
    const keepAspectRatio = action.keepAspectRatio ?? (action.width === undefined || action.height === undefined);
    if (keepAspectRatio) {
      const factor = action.width === undefined ? factorY : action.height === undefined ? factorX : Math.max(factorX, factorY);
      factorX = factor;
      factorY = factor;
    }

    const group = createTransientSelectionGroup(core, [id]);
    group.beginTransform();
    const frame = {
      translateX: group.translateX,
      translateY: group.translateY,
      width: group.width,
      height: group.height,
      padding: group.padding,
      scale: group.scale,
      rotation: group.rotation,
    };
    const fixed = fixedCorner(frame, handle);
    const start = computeAnchoredResize(frame, handle, fixed, frame.width, frame.height);
    const end = computeAnchoredResize(frame, handle, fixed, frame.width * factorX, frame.height * factorY);

    // Groups keep their child snapshots stable while the agent resizes them (like a user resize).
    const locked = Array.from(collectWithDescendants(map, [id]))
      .map(objectId => map.findById(objectId))
      .filter((candidate): candidate is UpdrawGroup => candidate instanceof UpdrawGroup);
    locked.forEach(groupObject => UpdrawGroup.transformLocks.add(groupObject));
    run.onSettle(() => locked.forEach(groupObject => UpdrawGroup.transformLocks.delete(groupObject)));

    await run.fly(start.handle);
    await run.press();

    const scale = core.store.state.scale || 1;
    const distance = Math.hypot(end.handle.x - start.handle.x, end.handle.y - start.handle.y) * scale;
    await run.animate(
      run.dragDuration(distance),
      (eased, _raw, isLast) => {
        const width = frame.width + (end.width - frame.width) * eased;
        const height = frame.height + (end.height - frame.height) * eased;
        const step = computeAnchoredResize(frame, handle, fixed, width, height);
        run.mutate(() => group.resize(step.x, step.y, step.width, step.height), isLast ? 'final' : 'throttled');
        cursors.setPosition(run.cursorId, step.handle);
      },
      run.options.easing ?? 'ease-in-out',
    );

    await run.release();
    run.changedProperties.set(id, ['translateX', 'translateY', 'width', 'height']);
    run.finalAttachment = { objectId: id, anchor: handle };
    return [id];
  },
};
