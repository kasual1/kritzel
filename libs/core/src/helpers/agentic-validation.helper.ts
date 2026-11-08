import type {
  KritzelAgenticAnchor,
  KritzelAgenticObjectTarget,
  KritzelAgenticPointTarget,
} from '../interfaces/agentic-cursor.interface';
import type { KritzelAgenticOrder, KritzelAgenticResizeHandle } from '../interfaces/agentic-action.interface';
import type { ArrowHeadStyle } from '../interfaces/arrow-head.interface';
import { ShapeType } from '../enums/shape-type.enum';
import { AGENTIC_ANCHOR_FACTORS, isAgenticAnchor } from './agentic-geometry.helper';
import { KritzelMathHelper } from './math.helper';

/** Every anchor on an object. */
export const AGENTIC_ANCHORS = Object.keys(AGENTIC_ANCHOR_FACTORS) as KritzelAgenticAnchor[];
/** Every shape type an agent can create. */
export const AGENTIC_SHAPE_TYPES = Object.values(ShapeType) as `${ShapeType}`[];
/** The corner handles of `resizeObject`. */
export const AGENTIC_RESIZE_HANDLES: readonly KritzelAgenticResizeHandle[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
/** Every arrow head style. */
export const AGENTIC_ARROW_HEAD_STYLES: readonly ArrowHeadStyle[] = ['triangle', 'open', 'diamond', 'circle'];

/** Style fields per action; an unknown field is an error. */
export const AGENTIC_SHAPE_STYLE_KEYS = ['fillColor', 'strokeColor', 'strokeWidth', 'opacity', 'fontSize', 'fontFamily', 'fontColor'] as const;
export const AGENTIC_TEXT_STYLE_KEYS = ['fontSize', 'fontFamily', 'fontColor', 'opacity'] as const;
export const AGENTIC_STROKE_STYLE_KEYS = ['strokeColor', 'strokeWidth', 'opacity'] as const;
export const AGENTIC_LINE_STYLE_KEYS = ['strokeColor', 'strokeWidth', 'opacity', 'arrows'] as const;
export const AGENTIC_OBJECT_STYLE_KEYS = ['fillColor', 'strokeColor', 'strokeWidth', 'opacity', 'fontSize', 'fontFamily', 'fontColor', 'arrows'] as const;

const MAX_COLOR_LENGTH = 100;

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
  if (anchor !== undefined && !isAgenticAnchor(anchor)) {
    throw new TypeError(`"${field}" must be one of ${AGENTIC_ANCHORS.join(', ')}.`);
  }
}

/** Throws a `TypeError` unless `value` is a CSS color string or `{ light, dark }`. */
export function assertColor(value: unknown, field: string): void {
  if (typeof value === 'string') {
    if (value.trim().length === 0 || value.length > MAX_COLOR_LENGTH) {
      throw new TypeError(`"${field}" must be a CSS color.`);
    }
    return;
  }
  if (isPlainObject(value) && isColorString(value.light) && isColorString(value.dark)) {
    return;
  }
  throw new TypeError(`"${field}" must be a CSS color string or { light, dark }.`);
}

/**
 * Throws a `TypeError` unless `style` is undefined (or, with `required`, set) and an object with only
 * the given fields, each of the right type: colors, positive sizes, an opacity from 0 to 1, a font
 * family and arrows.
 */
export function assertStyle(style: unknown, field: string, keys: readonly string[], options: { required?: boolean } = {}): void {
  if (style === undefined && !options.required) {
    return;
  }
  if (!isPlainObject(style)) {
    throw new TypeError(`"${field}" must be an object with any of ${keys.join(', ')}.`);
  }
  const entries = Object.entries(style).filter(([, value]) => value !== undefined);
  for (const [key, value] of entries) {
    const path = `${field}.${key}`;
    if (!keys.includes(key)) {
      throw new TypeError(`Unknown property "${path}". Use ${keys.join(', ')}.`);
    }
    switch (key) {
      case 'fillColor':
      case 'strokeColor':
      case 'fontColor':
        assertColor(value, path);
        break;
      case 'strokeWidth':
      case 'fontSize':
        if (!KritzelMathHelper.isFiniteNumber(value) || value <= 0) {
          throw new TypeError(`"${path}" must be a number greater than 0.`);
        }
        break;
      case 'opacity':
        if (!KritzelMathHelper.isFiniteNumber(value) || value < 0 || value > 1) {
          throw new TypeError(`"${path}" must be a number from 0 to 1.`);
        }
        break;
      case 'fontFamily':
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw new TypeError(`"${path}" must be a font family name.`);
        }
        break;
      case 'arrows':
        assertArrows(value, path);
        break;
    }
  }
  if (options.required && entries.length === 0) {
    throw new TypeError(`"${field}" must set at least one of ${keys.join(', ')}.`);
  }
}

/** Throws a `TypeError` unless `arrows` is `{ start?, end? }` with valid arrow heads. */
export function assertArrows(arrows: unknown, field: string): void {
  if (!isPlainObject(arrows)) {
    throw new TypeError(`"${field}" must be { start?, end? }.`);
  }
  for (const [end, head] of Object.entries(arrows)) {
    const path = `${field}.${end}`;
    if (end !== 'start' && end !== 'end') {
      throw new TypeError(`Unknown property "${path}". Use start, end.`);
    }
    if (head === undefined) {
      continue;
    }
    if (!isPlainObject(head) || typeof head.enabled !== 'boolean') {
      throw new TypeError(`"${path}" must be { enabled, style?, size? }.`);
    }
    for (const [key, value] of Object.entries(head)) {
      if (value === undefined || key === 'enabled') {
        continue;
      }
      if (key === 'style') {
        if (!AGENTIC_ARROW_HEAD_STYLES.includes(value as ArrowHeadStyle)) {
          throw new TypeError(`"${path}.style" must be one of ${AGENTIC_ARROW_HEAD_STYLES.join(', ')}.`);
        }
      } else if (key === 'size') {
        if (!KritzelMathHelper.isFiniteNumber(value) || value <= 0) {
          throw new TypeError(`"${path}.size" must be a number greater than 0.`);
        }
      } else if (key === 'fill') {
        if (!isPlainObject(value) || !isColorString(value.light) || !isColorString(value.dark)) {
          throw new TypeError(`"${path}.fill" must be { light, dark }.`);
        }
      } else {
        throw new TypeError(`Unknown property "${path}.${key}". Use enabled, style, size, fill.`);
      }
    }
  }
}

/**
 * Throws a `TypeError` unless `target` is `{ x, y }` or `{ objectId, anchor?, offset? }`. Element targets
 * (`{ objectId, selector }`) are refused: actions resolve their targets synchronously, while an element's position
 * has to be asked from the object's content first. Only `agent.moveTo()` points at elements.
 */
export function assertTarget(target: unknown, field: string): asserts target is KritzelAgenticPointTarget | KritzelAgenticObjectTarget {
  if (!target || typeof target !== 'object') {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
  const candidate = target as { objectId?: unknown; selector?: unknown; x?: unknown; y?: unknown; anchor?: unknown; offset?: { x?: unknown; y?: unknown } };
  if (candidate.selector !== undefined) {
    throw new TypeError(`"${field}" can't be an element inside an object. Use agent.moveTo({ objectId, selector }) to point at an element.`);
  }
  if (candidate.objectId !== undefined) {
    assertObjectId(candidate.objectId, `${field}.objectId`);
    assertAnchor(candidate.anchor, `${field}.anchor`);
    if (candidate.offset !== undefined && (!KritzelMathHelper.isFiniteNumber(candidate.offset?.x) || !KritzelMathHelper.isFiniteNumber(candidate.offset?.y))) {
      throw new TypeError(`"${field}.offset" must be { x, y }.`);
    }
    return;
  }
  if (!KritzelMathHelper.isFiniteNumber(candidate.x) || !KritzelMathHelper.isFiniteNumber(candidate.y)) {
    throw new TypeError(`"${field}" must be { x, y } or { objectId }.`);
  }
}

/** Where `orderObjects` can move objects. */
export const AGENTIC_ORDERS: readonly KritzelAgenticOrder[] = ['front', 'back', 'forward', 'backward'];

/** Removes duplicates while keeping the order. */
export function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isColorString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_COLOR_LENGTH;
}
