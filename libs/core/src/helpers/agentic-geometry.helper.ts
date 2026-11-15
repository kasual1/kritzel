import type { UpmadeAgenticAnchor, UpmadeAgenticElementTarget, UpmadeAgenticObjectTarget, UpmadeAgenticTarget } from '../interfaces/agentic-cursor.interface';
import type { UpmadePoint } from '../interfaces/point.interface';
import type { UpmadeBoundingBox } from '../interfaces/bounding-box.interface';

/** Relative position of each anchor within an object's unrotated box. */
export const AGENTIC_ANCHOR_FACTORS: Record<UpmadeAgenticAnchor, [number, number]> = {
  'center': [0.5, 0.5],
  'top-left': [0, 0],
  'top': [0.5, 0],
  'top-right': [1, 0],
  'right': [1, 0.5],
  'bottom-right': [1, 1],
  'bottom': [0.5, 1],
  'bottom-left': [0, 1],
  'left': [0, 0.5],
};

/** The parts of an object the anchor math needs. */
export interface UpmadeAnchorableGeometry {
  boundingBox: UpmadeBoundingBox;
  rotation?: number;
}

/**
 * Resolves an anchor (plus an offset in the object's local, unrotated space) to a world point.
 * The anchor rotates with the object around its center.
 */
/** Whether a target refers to an object: `{ objectId }`, or `{ objectId, selector }` for an element inside it. */
export function isObjectTarget(target: UpmadeAgenticTarget): target is UpmadeAgenticObjectTarget | UpmadeAgenticElementTarget {
  return typeof (target as { objectId?: unknown }).objectId === 'string';
}

/** Whether a target points at an element inside an object (`{ objectId, selector }`). */
export function isElementTarget(target: UpmadeAgenticTarget): target is UpmadeAgenticElementTarget {
  return isObjectTarget(target) && typeof (target as { selector?: unknown }).selector === 'string';
}

/** Whether `value` is one of the anchors (an own key of the anchor table, never an inherited one). */
export function isAgenticAnchor(value: unknown): value is UpmadeAgenticAnchor {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(AGENTIC_ANCHOR_FACTORS, value);
}

export function resolveObjectAnchor(
  object: UpmadeAnchorableGeometry,
  anchor: UpmadeAgenticAnchor = 'center',
  offset?: UpmadePoint,
): UpmadePoint {
  const box = object.boundingBox;
  // Own keys only: an anchor from untrusted input such as "toString" must not reach Object.prototype.
  const [ax, ay] = isAgenticAnchor(anchor) ? AGENTIC_ANCHOR_FACTORS[anchor] : AGENTIC_ANCHOR_FACTORS.center;
  const localX = box.x + ax * box.width + (offset?.x ?? 0);
  const localY = box.y + ay * box.height + (offset?.y ?? 0);

  const rotation = object.rotation ?? 0;
  if (!rotation) {
    return { x: localX, y: localY };
  }

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: cos * (localX - cx) - sin * (localY - cy) + cx,
    y: sin * (localX - cx) + cos * (localY - cy) + cy,
  };
}

/** Union of the given objects' rotated bounding boxes. */
export function unionBox(objects: { rotatedBoundingBox: UpmadeBoundingBox }[]): { x: number; y: number; width: number; height: number } | null {
  if (objects.length === 0) {
    return null;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const object of objects) {
    const box = object.rotatedBoundingBox;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Center of the union of the given objects' rotated bounding boxes. */
export function unionCenter(objects: { rotatedBoundingBox: UpmadeBoundingBox }[]): UpmadePoint | null {
  const box = unionBox(objects);
  return box && { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Whether `point` lies inside the polygon given by its corners (ray casting). */
export function isPointInCorners(point: UpmadePoint, corners: UpmadePoint[]): boolean {
  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const xi = corners[i].x;
    const yi = corners[i].y;
    const xj = corners[j].x;
    const yj = corners[j].y;
    const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}
