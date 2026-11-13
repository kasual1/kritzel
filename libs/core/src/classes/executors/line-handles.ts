import type { UpdrawAgenticLineEnd } from '../../interfaces/agentic-action.interface';
import type { UpdrawPoint } from '../../interfaces/point.interface';
import type { UpdrawCore } from '../core/core.class';
import type { UpdrawAgenticActionRun } from '../managers/agentic-action-run.class';
import type { UpdrawAgenticRefusal } from '../../types/agentic-action.types';
import { UpdrawLine } from '../objects/line.class';
import { isSelectionObject } from '../../helpers/agentic-conflict.helper';
import { assertObjectId } from '../../helpers/agentic-validation.helper';
import { UpdrawMathHelper } from '../../helpers/math.helper';

/**
 * What `drawLine` and `editLine` share: line geometry in world coordinates, and dragging a line's handles the
 * way the line handle handler does (an end, or the middle handle that bends the line).
 */

/** A line in world coordinates: its ends and, for a curve, its quadratic control point. */
export interface UpdrawLineWorldGeometry {
  start: UpdrawPoint;
  end: UpdrawPoint;
  control?: UpdrawPoint;
}

export type UpdrawLineHandle = 'start' | 'end';

/** Throws a `TypeError` unless `end` is `{ x, y }` or `{ objectId }`. */
export function assertLineEnd(end: unknown, field: string): asserts end is UpdrawAgenticLineEnd {
  if (!end || typeof end !== 'object' || Array.isArray(end)) {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
  const candidate = end as { objectId?: unknown; x?: unknown; y?: unknown };
  if (candidate.objectId !== undefined) {
    if (candidate.x !== undefined || candidate.y !== undefined) {
      throw new TypeError(`"${field}" takes either x and y or objectId, not both.`);
    }
    assertObjectId(candidate.objectId, `${field}.objectId`);
    return;
  }
  if (!UpdrawMathHelper.isFiniteNumber(candidate.x) || !UpdrawMathHelper.isFiniteNumber(candidate.y)) {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
}

/** Throws a `TypeError` unless `point` is undefined or `{ x, y }`. */
export function assertOptionalPoint(point: unknown, field: string): asserts point is UpdrawPoint | undefined {
  if (point === undefined) {
    return;
  }
  const candidate = point as { x?: unknown; y?: unknown } | null;
  if (!candidate || typeof candidate !== 'object' || !UpdrawMathHelper.isFiniteNumber(candidate.x) || !UpdrawMathHelper.isFiniteNumber(candidate.y)) {
    throw new TypeError(`"${field}" must be { x, y }.`);
  }
}

export function isObjectEnd(end: UpdrawAgenticLineEnd): end is { objectId: string } {
  return 'objectId' in end && end.objectId !== undefined;
}

/** Refuses an object end that a line can't attach to: a missing object, a selection, a line, or `lineId` itself. */
export function refuseUnanchorable(run: UpdrawAgenticActionRun, objectId: string, lineId?: string): UpdrawAgenticRefusal | null {
  const object = run.map!.findById(objectId);
  if (!object || objectId === lineId || isSelectionObject(object) || !run.core.anchorManager.isAnchorable(object)) {
    return { reason: 'invalid-target', objectIds: [objectId] };
  }
  return null;
}

/** The world point of an end: an object's center (stopping the run if it is gone), or the point itself. */
export function resolveLineEnd(run: UpdrawAgenticActionRun, end: UpdrawAgenticLineEnd): UpdrawPoint {
  if (!isObjectEnd(end)) {
    return { x: end.x, y: end.y };
  }
  const center = run.cursorManager.resolveTarget({ objectId: end.objectId, anchor: 'center' });
  if (!center) {
    run.stop('object-removed', [end.objectId]);
  }
  return center;
}

/** The point halfway along a line: on the curve for a curved line (where its middle handle sits). */
export function lineMidpoint(geometry: UpdrawLineWorldGeometry): UpdrawPoint {
  const { start, end, control } = geometry;
  if (!control) {
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  }
  return { x: 0.25 * start.x + 0.5 * control.x + 0.25 * end.x, y: 0.25 * start.y + 0.5 * control.y + 0.25 * end.y };
}

/** The control point of the quadratic curve from `start` to `end` that passes through `through` halfway. */
export function controlThrough(start: UpdrawPoint, end: UpdrawPoint, through: UpdrawPoint): UpdrawPoint {
  return { x: 2 * through.x - (start.x + end.x) / 2, y: 2 * through.y - (start.y + end.y) / 2 };
}

export function lerpPoint(from: UpdrawPoint, to: UpdrawPoint, t: number): UpdrawPoint {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Reads a line's geometry in world coordinates. */
export function readLineGeometry(core: UpdrawCore, line: UpdrawLine): UpdrawLineWorldGeometry {
  const toWorld = (x: number, y: number) => core.anchorManager.lineLocalToWorld(line, x, y);
  return {
    start: toWorld(line.startX, line.startY),
    end: toWorld(line.endX, line.endY),
    ...(line.controlX !== undefined && line.controlY !== undefined ? { control: toWorld(line.controlX, line.controlY) } : {}),
  };
}

/**
 * Gives a line new world geometry in place, keeping its ID, style, anchors and scale. The line is rebuilt
 * unrotated: the same world points describe it fully.
 */
export function applyLineGeometry(line: UpdrawLine, geometry: UpdrawLineWorldGeometry): void {
  const scale = line.scale || 1;
  const shaped = new UpdrawLine({
    startX: geometry.start.x * scale,
    startY: geometry.start.y * scale,
    endX: geometry.end.x * scale,
    endY: geometry.end.y * scale,
    controlX: geometry.control ? geometry.control.x * scale : undefined,
    controlY: geometry.control ? geometry.control.y * scale : undefined,
    translateX: 0,
    translateY: 0,
    scale,
    strokeWidth: line.strokeWidth,
  });
  line.startX = shaped.startX;
  line.startY = shaped.startY;
  line.endX = shaped.endX;
  line.endY = shaped.endY;
  line.controlX = shaped.controlX;
  line.controlY = shaped.controlY;
  line.x = shaped.x;
  line.y = shaped.y;
  line.width = shaped.width;
  line.height = shaped.height;
  line.translateX = shaped.translateX;
  line.translateY = shaped.translateY;
  line.rotation = 0;
  // Geometry and anchor clipping are cached; recompute them on demand (as the line handle handler does).
  const caches = line as unknown as { _adjustedPoints: number[][] | null; _clipInfo: unknown };
  caches._adjustedPoints = null;
  caches._clipInfo = null;
}

/** The properties `applyLineGeometry` and anchoring change. */
export const LINE_GEOMETRY_PROPERTIES = [
  'startX',
  'startY',
  'endX',
  'endY',
  'controlX',
  'controlY',
  'translateX',
  'translateY',
  'width',
  'height',
  'rotation',
  'startAnchor',
  'endAnchor',
];

function currentLine(run: UpdrawAgenticActionRun, lineId: string): UpdrawLine {
  const line = run.map!.findById(lineId);
  if (!(line instanceof UpdrawLine)) {
    run.stop('object-removed', [lineId]);
  }
  return line;
}

/**
 * Drags one end of a line to `destination` like the end handle: the end comes loose first, follows the cursor,
 * and attaches to the destination object on release.
 */
export async function dragLineEnd(run: UpdrawAgenticActionRun, lineId: string, handle: UpdrawLineHandle, destination: UpdrawAgenticLineEnd): Promise<void> {
  const core = run.core;
  const map = run.map!;
  const cursors = run.cursorManager;

  const grip = readLineGeometry(core, currentLine(run, lineId))[handle];
  await run.fly(grip);
  await run.press();

  const anchored = handle === 'start' ? currentLine(run, lineId).startAnchor : currentLine(run, lineId).endAnchor;
  if (anchored) {
    run.mutate(() => {
      core.anchorManager.removeAnchor(lineId, handle);
      map.update(currentLine(run, lineId));
    });
  }

  const target = resolveLineEnd(run, destination);
  const distance = Math.hypot(target.x - grip.x, target.y - grip.y) * (core.store.state.scale || 1);
  await run.animate(
    run.dragDuration(distance),
    (eased, _raw, isLast) => {
      const position = lerpPoint(grip, resolveLineEnd(run, destination), eased);
      run.mutate(() => {
        const line = currentLine(run, lineId);
        applyLineGeometry(line, { ...readLineGeometry(core, line), [handle]: position });
        map.update(line);
      }, isLast ? 'final' : 'throttled');
      cursors.setPosition(run.cursorId, position);
    },
    run.options.easing ?? 'ease-in-out',
  );

  if (isObjectEnd(destination)) {
    run.mutate(() => core.anchorManager.setAnchor(lineId, handle, destination.objectId));
  }
  await run.release();
}

/**
 * Drags the middle handle of a line so the line curves through `through`, or back onto the straight line
 * (`through` undefined), like the middle handle does.
 */
export async function bendLine(run: UpdrawAgenticActionRun, lineId: string, through: UpdrawPoint | undefined): Promise<void> {
  const core = run.core;
  const map = run.map!;
  const cursors = run.cursorManager;

  const grip = lineMidpoint(readLineGeometry(core, currentLine(run, lineId)));
  await run.fly(grip);
  await run.press();

  const straightMidpoint = () => {
    const { start, end } = readLineGeometry(core, currentLine(run, lineId));
    return lineMidpoint({ start, end });
  };
  const target = through ?? straightMidpoint();
  const distance = Math.hypot(target.x - grip.x, target.y - grip.y) * (core.store.state.scale || 1);
  await run.animate(
    run.dragDuration(distance),
    (eased, _raw, isLast) => {
      const position = lerpPoint(grip, through ?? straightMidpoint(), eased);
      run.mutate(() => {
        const line = currentLine(run, lineId);
        const { start, end } = readLineGeometry(core, line);
        const straight = isLast && !through;
        applyLineGeometry(line, { start, end, ...(straight ? {} : { control: controlThrough(start, end, position) }) });
        map.update(line);
      }, isLast ? 'final' : 'throttled');
      cursors.setPosition(run.cursorId, position);
    },
    run.options.easing ?? 'ease-in-out',
  );
  await run.release();
}
