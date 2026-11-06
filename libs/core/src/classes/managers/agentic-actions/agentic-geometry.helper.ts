import type { KritzelAgenticCursorAnchor } from '../../../interfaces/agentic-cursor.interface';
import type { KritzelPoint } from '../../../interfaces/point.interface';
import type { KritzelBoundingBox } from '../../../interfaces/bounding-box.interface';

/** Relative position of each anchor within an object's unrotated box. */
export const AGENTIC_ANCHOR_FACTORS: Record<KritzelAgenticCursorAnchor, [number, number]> = {
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
export interface KritzelAnchorableGeometry {
  boundingBox: KritzelBoundingBox;
  rotation?: number;
}

/**
 * Resolves an anchor (plus an offset in the object's local, unrotated space) to a world point.
 * The anchor rotates with the object around its center.
 */
export function resolveObjectAnchor(
  object: KritzelAnchorableGeometry,
  anchor: KritzelAgenticCursorAnchor = 'center',
  offset?: KritzelPoint,
): KritzelPoint {
  const box = object.boundingBox;
  const [ax, ay] = AGENTIC_ANCHOR_FACTORS[anchor] ?? AGENTIC_ANCHOR_FACTORS.center;
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

/** Center of the union of the given objects' rotated bounding boxes. */
export function unionCenter(objects: { rotatedBoundingBox: KritzelBoundingBox }[]): KritzelPoint | null {
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
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

/** Whether `point` lies inside the polygon given by its corners (ray casting). */
export function isPointInCorners(point: KritzelPoint, corners: KritzelPoint[]): boolean {
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
