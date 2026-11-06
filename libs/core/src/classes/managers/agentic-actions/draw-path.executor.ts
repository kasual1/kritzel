import type { KritzelAgenticDrawPathAction } from '../../../interfaces/agentic-action.interface';
import type { KritzelPoint } from '../../../interfaces/point.interface';
import { KritzelPath } from '../../objects/path.class';
import { AGENTIC_ACTION_DRAW_SPEED, type KritzelAgenticActionExecutor } from './agentic-action.types';
import { resolveBrushStyle } from './agentic-style.helper';

/** Same as the brush tool: points closer than this many screen pixels are dropped. */
const MIN_POINT_DISTANCE_PX = 3;

/** Cumulative arc lengths of a polyline. */
export function cumulativeLengths(points: KritzelPoint[]): number[] {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  return lengths;
}

/**
 * The part of a polyline up to arc length `distance`, ending in an interpolated tip.
 * Points closer than `minDistance` to the previously kept point are dropped (the tip is always kept).
 */
export function polylinePrefix(points: KritzelPoint[], lengths: number[], distance: number, minDistance: number): KritzelPoint[] {
  const total = lengths[lengths.length - 1];
  const target = Math.max(0, Math.min(distance, total));
  const result: KritzelPoint[] = [points[0]];
  let tip: KritzelPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    if (lengths[i] <= target) {
      tip = points[i];
      const last = result[result.length - 1];
      if (Math.hypot(tip.x - last.x, tip.y - last.y) >= minDistance) {
        result.push(tip);
      }
      continue;
    }
    const segment = lengths[i] - lengths[i - 1];
    const t = segment > 0 ? (target - lengths[i - 1]) / segment : 0;
    tip = { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t };
    break;
  }

  const last = result[result.length - 1];
  if (last !== tip && (last.x !== tip.x || last.y !== tip.y)) {
    result.push(tip);
  }
  return result;
}

/** `drawPath`: presses at the first point and draws through the points like the brush. */
export const drawPathExecutor: KritzelAgenticActionExecutor<KritzelAgenticDrawPathAction> = {
  mutates: true,

  validate(action) {
    if (
      !Array.isArray(action.points) ||
      action.points.length < 2 ||
      action.points.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y))
    ) {
      throw new TypeError('"points" must contain at least two { x, y } world points.');
    }
  },

  prepare() {
    return { targetIds: [], referenceIds: [] };
  },

  async execute(run, action) {
    const core = run.core;
    const map = run.map!;
    const cursors = run.cursorManager;
    const state = core.store.state;
    const style = resolveBrushStyle(core, action.style);
    // Paths store screen-like units: world units times their scale, as the brush creates them.
    const scale = state.lockDrawingScale ? 1 : state.scale || 1;
    const points = action.points.map(point => ({ x: point.x, y: point.y }));
    const lengths = cumulativeLengths(points);
    const total = lengths[lengths.length - 1];
    const minDistance = MIN_POINT_DISTANCE_PX / (state.scale || 1);

    const build = (worldPoints: KritzelPoint[]) => {
      const path = KritzelPath.create(core, {
        points: worldPoints.map(point => [point.x * scale, point.y * scale]),
        translateX: 0,
        translateY: 0,
        scale,
        fill: style.color,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
      });
      // Completed from the start, so the user's tools never treat it as their stroke in progress.
      path.isCompleted = true;
      return path;
    };

    await run.fly(points[0]);
    await run.press();

    const first = run.mutate(() => {
      const created = build([points[0]]);
      core.addObject(created);
      return created;
    });
    run.track(first);

    await run.animate(
      run.phaseDuration(total * (state.scale || 1), AGENTIC_ACTION_DRAW_SPEED, 250, 4000),
      (eased, _raw, isLast) => {
        const prefix = isLast ? polylinePrefix(points, lengths, total, minDistance) : polylinePrefix(points, lengths, total * eased, minDistance);
        const next = build(prefix);
        next.id = first.id;
        next.workspaceId = first.workspaceId;
        next.zIndex = first.zIndex;
        // Like the brush, each step replaces the path with one built from the longer point list.
        run.mutate(() => map.update(next), isLast ? 'final' : 'throttled');
        run.track(next);
        cursors.setPosition(run.cursorId, prefix[prefix.length - 1]);
      },
      run.options.easing ?? 'linear',
    );

    await run.release();
    return [first.id];
  },
};
