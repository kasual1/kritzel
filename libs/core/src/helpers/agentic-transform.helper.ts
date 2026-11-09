import type { KritzelCore } from '../classes/core/core.class';
import type { KritzelPoint } from '../interfaces/point.interface';
import type { KritzelAgenticResizeHandle } from '../interfaces/agentic-action.interface';
import { KritzelSelectionGroup } from '../classes/objects/selection-group.class';

/**
 * Creates a selection group over objects for agent transforms. It is never inserted into
 * the object map (so it is never synced, persisted or rendered), never touches the objects'
 * shared `isSelected` flags and is invisible to the user's tools.
 */
export function createTransientSelectionGroup(core: KritzelCore, objectIds: string[]): KritzelSelectionGroup {
  const group = KritzelSelectionGroup.create(core);
  group.objectIds = [...objectIds];
  const children = group.objects;
  if (children.length === 1) {
    group.rotation = children[0].rotation;
  }
  group.refreshObjectDimensions(children, true);
  group.captureUnchangedSnapshots(children);
  return group;
}

/** Rotates a vector by `angle` radians. */
export function rotateVector(x: number, y: number, angle: number): KritzelPoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: cos * x - sin * y, y: sin * x + cos * y };
}

/** Direction of a resize handle: +1 towards right/bottom, -1 towards left/top. */
export function handleSigns(handle: KritzelAgenticResizeHandle): { sx: number; sy: number } {
  return {
    sx: handle.endsWith('right') ? 1 : -1,
    sy: handle.startsWith('bottom') ? 1 : -1,
  };
}

/** Geometry of a selection group needed to resize it around a fixed corner. */
export interface KritzelAnchoredResizeFrame {
  /** Translate X/Y of the unrotated group box (world). */
  translateX: number;
  translateY: number;
  /** Width/height in group units (world size * scale), without padding. */
  width: number;
  height: number;
  padding: number;
  scale: number;
  rotation: number;
}

/** Result of `computeAnchoredResize`: the arguments for `KritzelSelectionGroup.resize` and the dragged corner. */
export interface KritzelAnchoredResizeStep {
  x: number;
  y: number;
  width: number;
  height: number;
  /** World position of the dragged corner. */
  handle: KritzelPoint;
}

/** World position of the corner opposite to `handle`, which stays in place while resizing. */
export function fixedCorner(frame: KritzelAnchoredResizeFrame, handle: KritzelAgenticResizeHandle): KritzelPoint {
  const { sx, sy } = handleSigns(handle);
  const k = frame.scale || 1;
  const totalWidth = frame.width + frame.padding * 2;
  const totalHeight = frame.height + frame.padding * 2;
  const center = { x: frame.translateX + totalWidth / 2 / k, y: frame.translateY + totalHeight / 2 / k };
  const offset = rotateVector((-sx * totalWidth) / 2 / k, (-sy * totalHeight) / 2 / k, frame.rotation);
  return { x: center.x + offset.x, y: center.y + offset.y };
}

/**
 * Computes where a group of the given size must be placed so that the corner opposite to `handle`
 * stays at `fixed`, following the rotated box. Matches the center-based math of `KritzelSelectionGroup.resize`.
 */
export function computeAnchoredResize(
  frame: KritzelAnchoredResizeFrame,
  handle: KritzelAgenticResizeHandle,
  fixed: KritzelPoint,
  width: number,
  height: number,
): KritzelAnchoredResizeStep {
  const { sx, sy } = handleSigns(handle);
  const k = frame.scale || 1;
  const totalWidth = width + frame.padding * 2;
  const totalHeight = height + frame.padding * 2;
  const toCenter = rotateVector((sx * totalWidth) / 2 / k, (sy * totalHeight) / 2 / k, frame.rotation);
  const center = { x: fixed.x + toCenter.x, y: fixed.y + toCenter.y };
  const toHandle = rotateVector((sx * totalWidth) / k, (sy * totalHeight) / k, frame.rotation);
  return {
    x: center.x - totalWidth / 2 / k,
    y: center.y - totalHeight / 2 / k,
    width,
    height,
    handle: { x: fixed.x + toHandle.x, y: fixed.y + toHandle.y },
  };
}

/** Normalizes an angle to (-π, π]. */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let result = ((angle % twoPi) + twoPi) % twoPi;
  if (result > Math.PI) {
    result -= twoPi;
  }
  return result;
}

/** The rotation an agent rotates to: `relative` adds; absolute angles take the short way round. */
export function targetRotation(current: number, angleDegrees: number, relative: boolean): number {
  const radians = (angleDegrees * Math.PI) / 180;
  return relative ? current + radians : current + normalizeAngle(radians - current);
}
