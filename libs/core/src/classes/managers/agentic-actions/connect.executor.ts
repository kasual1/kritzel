import type { KritzelAgenticConnectAction } from '../../../interfaces/agentic-action.interface';
import type { KritzelPoint } from '../../../interfaces/point.interface';
import { KritzelLine } from '../../objects/line.class';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import { isSelectionObject } from './agentic-conflict.helper';
import { resolveLineStyle } from './agentic-style.helper';
import { AGENTIC_LINE_STYLE_KEYS, assertObjectId, assertStyle } from './agentic-validation.helper';

/** `connect`: drags a line from one object to another and anchors both ends, so it follows them. */
export const connectExecutor: KritzelAgenticActionExecutor<KritzelAgenticConnectAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.from, 'from');
    assertObjectId(action.to, 'to');
    assertStyle(action.style, 'style', AGENTIC_LINE_STYLE_KEYS);
  },

  prepare(run, action) {
    const map = run.map!;
    if (action.from === action.to) {
      return { reason: 'invalid-target', objectIds: [action.to] };
    }
    for (const id of [action.from, action.to]) {
      const object = map.findById(id);
      if (!object || isSelectionObject(object) || !run.core.anchorManager.isAnchorable(object)) {
        return { reason: 'invalid-target', objectIds: [id] };
      }
    }
    // Both ends are only read; the line is the agent's own new object.
    return { targetIds: [], referenceIds: [action.from, action.to] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const cursors = run.cursorManager;
    const state = core.store.state;
    const style = resolveLineStyle(core, action.style);
    const scale = state.lockDrawingScale ? 1 : state.scale || 1;

    const centerOf = (id: string): KritzelPoint => {
      const point = cursors.resolveTarget({ objectId: id, anchor: 'center' });
      if (!point) {
        run.stop('object-removed', [id]);
      }
      return point;
    };

    const build = (start: KritzelPoint, end: KritzelPoint) => {
      const line = KritzelLine.create(core, {
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
      // Every frame replaces the line, so each instance must name the agent as its creator.
      return run.own(line);
    };

    const startPoint = centerOf(action.from);
    await run.fly(startPoint);
    await run.press();

    // The line stays unanchored until it arrives, so deleting an end mid-drag only aborts the action.
    const first = run.mutate(() => {
      const created = build(startPoint, startPoint);
      core.addObject(created);
      return created;
    });
    run.track(first);

    const distance = Math.hypot(centerOf(action.to).x - startPoint.x, centerOf(action.to).y - startPoint.y) * (state.scale || 1);
    await run.animate(
      run.dragDuration(distance),
      (eased, _raw, isLast) => {
        const start = centerOf(action.from);
        const target = centerOf(action.to);
        const end = { x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased };
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

    run.mutate(() => {
      core.anchorManager.setAnchor(first.id, 'start', action.from);
      core.anchorManager.setAnchor(first.id, 'end', action.to);
    });
    await run.release();

    run.finalAttachment = { objectId: action.to, anchor: 'center' };
    return [first.id];
  },
};
