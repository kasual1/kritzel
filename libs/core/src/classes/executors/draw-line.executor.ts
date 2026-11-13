import type { UpdrawAgenticDrawLineAction } from '../../interfaces/agentic-action.interface';
import type { UpdrawPoint } from '../../interfaces/point.interface';
import { UpdrawLine } from '../objects/line.class';
import type { UpdrawAgenticActionExecutor } from '../../types/agentic-action.types';
import { resolveLineStyle } from '../../helpers/agentic-style.helper';
import { AGENTIC_LINE_STYLE_KEYS, assertStyle } from '../../helpers/agentic-validation.helper';
import { assertLineEnd, assertOptionalPoint, bendLine, isObjectEnd, lerpPoint, refuseUnanchorable, resolveLineEnd } from './line-handles';

/**
 * `drawLine`: draws a line like the line tool (press at `from`, drag to `to`), bends it through `through` with
 * the middle handle, and attaches the ends that are objects.
 */
export const drawLineExecutor: UpdrawAgenticActionExecutor<UpdrawAgenticDrawLineAction> = {
  mutates: true,

  validate(action) {
    assertLineEnd(action.from, 'from');
    assertLineEnd(action.to, 'to');
    assertOptionalPoint(action.through, 'through');
    assertStyle(action.style, 'style', AGENTIC_LINE_STYLE_KEYS);
  },

  prepare(run, action) {
    const objectIds = [action.from, action.to].filter(isObjectEnd).map(end => end.objectId);
    if (objectIds.length === 2 && objectIds[0] === objectIds[1]) {
      return { reason: 'invalid-target', objectIds: [objectIds[0]] };
    }
    for (const id of objectIds) {
      const refusal = refuseUnanchorable(run, id);
      if (refusal) {
        return refusal;
      }
    }
    // The ends are only read; the line is the actor's own new object.
    return { targetIds: [], referenceIds: objectIds };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const cursors = run.cursorManager;
    const state = core.store.state;
    const style = resolveLineStyle(core, action.style);
    const scale = state.lockDrawingScale ? 1 : state.scale || 1;

    const build = (start: UpdrawPoint, end: UpdrawPoint) => {
      const line = UpdrawLine.create(core, {
        startX: start.x * scale,
        startY: start.y * scale,
        endX: end.x * scale,
        endY: end.y * scale,
        translateX: 0,
        translateY: 0,
        scale,
        stroke: style.color,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
        arrows: style.arrows,
      });
      line.isCompleted = true;
      // Every frame replaces the line, so each instance must name the actor as its creator.
      return run.own(line);
    };

    const startPoint = resolveLineEnd(run, action.from);
    await run.fly(startPoint);
    await run.press();

    // The line stays unanchored until it is drawn, so deleting an end object mid-drag only aborts the action.
    const first = run.mutate(() => {
      const created = build(startPoint, startPoint);
      core.addObject(created);
      return created;
    });
    run.track(first);

    const target = resolveLineEnd(run, action.to);
    const distance = Math.hypot(target.x - startPoint.x, target.y - startPoint.y) * (state.scale || 1);
    await run.animate(
      run.dragDuration(distance),
      (eased, _raw, isLast) => {
        const start = resolveLineEnd(run, action.from);
        const end = lerpPoint(start, resolveLineEnd(run, action.to), eased);
        const next = build(start, end);
        next.id = first.id;
        next.workspaceId = first.workspaceId;
        next.zIndex = first.zIndex;
        run.mutate(() => map.update(next), isLast ? 'final' : 'throttled');
        run.track(next);
        cursors.setPosition(run.cursorId, end);
      },
      run.options.easing ?? 'ease-in-out',
    );
    await run.release();

    if (action.through) {
      await bendLine(run, first.id, action.through);
    }

    run.mutate(() => {
      if (isObjectEnd(action.from)) core.anchorManager.setAnchor(first.id, 'start', action.from.objectId);
      if (isObjectEnd(action.to)) core.anchorManager.setAnchor(first.id, 'end', action.to.objectId);
    });

    if (isObjectEnd(action.to)) {
      run.finalAttachment = { objectId: action.to.objectId, anchor: 'center' };
    }
    return [first.id];
  },
};
