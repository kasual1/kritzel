import type { KritzelAgenticAnchor, KritzelAgenticTarget } from '../../../interfaces/agentic-cursor.interface';
import { AGENTIC_ANCHOR_FACTORS } from './agentic-geometry.helper';

/** Throws a `TypeError` unless `ids` is a non-empty array of non-empty strings. */
export function assertObjectIds(ids: unknown, field: string): asserts ids is string[] {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some(id => typeof id !== 'string' || id.length === 0)) {
    throw new TypeError(`"${field}" must be a non-empty array of object IDs.`);
  }
}

/** Throws a `TypeError` unless `id` is a non-empty string. */
export function assertObjectId(id: unknown, field: string): asserts id is string {
  if (typeof id !== 'string' || id.length === 0) {
    throw new TypeError(`"${field}" must be an object ID.`);
  }
}

/** Throws a `TypeError` unless `anchor` is undefined or a known anchor. */
export function assertAnchor(anchor: unknown, field: string): asserts anchor is KritzelAgenticAnchor | undefined {
  if (anchor !== undefined && !(typeof anchor === 'string' && anchor in AGENTIC_ANCHOR_FACTORS)) {
    throw new TypeError(`"${field}" must be an anchor such as 'center' or 'top-left'.`);
  }
}

/** Throws a `TypeError` unless `target` is `{ x, y }` or `{ objectId, anchor?, offset? }`. */
export function assertTarget(target: unknown, field: string): asserts target is KritzelAgenticTarget {
  if (!target || typeof target !== 'object') {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
  const candidate = target as { objectId?: unknown; x?: unknown; y?: unknown; anchor?: unknown; offset?: { x?: unknown; y?: unknown } };
  if (candidate.objectId !== undefined) {
    assertObjectId(candidate.objectId, `${field}.objectId`);
    assertAnchor(candidate.anchor, `${field}.anchor`);
    if (candidate.offset !== undefined && (!isFiniteNumber(candidate.offset?.x) || !isFiniteNumber(candidate.offset?.y))) {
      throw new TypeError(`"${field}.offset" must be { x, y }.`);
    }
    return;
  }
  if (!isFiniteNumber(candidate.x) || !isFiniteNumber(candidate.y)) {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
}

/** Whether a target refers to an object. */
export function isObjectTarget(target: KritzelAgenticTarget): target is Extract<KritzelAgenticTarget, { objectId: string }> {
  return typeof (target as { objectId?: unknown }).objectId === 'string';
}

/** Removes duplicates while keeping the order. */
export function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
