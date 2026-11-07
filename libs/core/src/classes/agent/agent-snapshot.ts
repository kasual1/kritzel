import type { KritzelCore } from '../core/core.class';
import type { KritzelBaseObject } from '../objects/base-object.class';
import type { KritzelObjectMap } from '../structures/object-map.structure';
import type { ThemeAwareColor } from '../../constants/color-palette.constants';
import type { KritzelCanvasObject, KritzelCanvasSnapshot, KritzelObserveOptions } from '../../interfaces/agent.interface';
import { KritzelShape } from '../objects/shape.class';
import { KritzelText } from '../objects/text.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelImage } from '../objects/image.class';
import { KritzelIframeObject } from '../objects/iframe.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelDynamicObject } from '../objects/dynamic-object.class';
import { KritzelRichTextHelper } from '../../helpers/rich-text.helper';
import { KritzelZOrderHelper } from '../../helpers/z-order.helper';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import {
  buildFrameCache,
  buildParentIndex,
  classifySelectionGroup,
  collectWithDescendants,
  isSelectionObject,
} from '../managers/agentic-actions/agentic-conflict.helper';

type AnyObject = KritzelBaseObject<any>;

const DEFAULT_MAX_OBJECTS = 100;
const DEFAULT_MAX_TEXT_LENGTH = 300;

/**
 * Builds what an agent sees of the canvas: the viewport, the user's selection, the agent itself and the
 * objects with their geometry, text, connections and style. Never includes image data, iframe code or
 * path points. Throws when no workspace is ready.
 */
export function buildCanvasSnapshot(core: KritzelCore, agentId: string, options: KritzelObserveOptions = {}): KritzelCanvasSnapshot {
  const map = getMap(core);
  if (!map) {
    throw new Error('The canvas is not ready (no workspace is loaded).');
  }
  const state = core.store.state;
  const scale = state.scale || 1;
  const viewport = {
    x: round(-(state.translateX || 0) / scale),
    y: round(-(state.translateY || 0) / scale),
    width: round((state.viewportWidth || 0) / scale),
    height: round((state.viewportHeight || 0) / scale),
    scale: Math.round(scale * 1000) / 1000,
  };
  const theme = core.themeManager?.currentTheme ?? 'light';
  // The same rule as the agents' conflict checks: selection groups that belong to the local user.
  const userSelection = Array.from(
    new Set(
      map
        .allObjects()
        .filter((object): object is KritzelSelectionGroup => object instanceof KritzelSelectionGroup && classifySelectionGroup(map, core, object) === 'human')
        .flatMap(group => group.objectIds),
    ),
  );
  const agentSelection = core.agenticActionManager?.getSelection(agentId) ?? [];
  const cursor = core.agenticCursorManager?.get(agentId);

  const parents = buildParentIndex(map);
  const frame = buildFrameCache(core, map);
  const candidates = map.allObjects().filter(object => !isSelectionObject(object) && object.isVisible !== false && hasFiniteBox(object));
  let objects = candidates;

  if (options.objectIds && options.objectIds.length > 0) {
    const wanted = collectWithDescendants(map, options.objectIds);
    objects = objects.filter(object => wanted.has(object.id));
  }
  if (options.scope === 'viewport') {
    objects = objects.filter(object => intersects(object.boundingBox, viewport));
  }

  const totalObjects = objects.length;
  const maxObjects = Math.max(1, options.maxObjects ?? DEFAULT_MAX_OBJECTS);
  let truncated = false;
  if (objects.length > maxObjects) {
    objects = keepMostRelevant(objects, maxObjects, new Set([...userSelection, ...agentSelection]), viewport, parents);
    truncated = true;
  }
  objects = [...objects].sort(KritzelZOrderHelper.compareStackOrder);

  const maxTextLength = Math.max(1, options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH);
  const described = objects.map(object => {
    const entry = describeObject(object, theme, maxTextLength);
    const parent = parents.get(object.id);
    if (parent) {
      entry.parentId = parent.id;
    }
    if (frame.humanSelectedIds.has(object.id) || (object instanceof KritzelText && object.isEditing)) {
      entry.busy = 'user';
    } else if (frame.collaboratorIds.has(object.id)) {
      entry.busy = 'collaborator';
    } else if (core.agenticActionManager?.isClaimedByOtherAgent(object.id, agentId)) {
      entry.busy = 'agent';
    }
    return entry;
  });

  return {
    viewport,
    theme,
    userSelection,
    agent: { id: agentId, position: cursor ? { x: round(cursor.position.x), y: round(cursor.position.y) } : null, selection: agentSelection },
    objects: described,
    totalObjects,
    ...(truncated ? { truncated: true as const } : {}),
  };
}

/** Describes one object for a snapshot (without `parentId` and `busy`). */
export function describeObject(object: AnyObject, theme: string, maxTextLength: number = DEFAULT_MAX_TEXT_LENGTH): KritzelCanvasObject {
  const box = object.boundingBox;
  const entry: KritzelCanvasObject = {
    id: object.id,
    type: typeOf(object),
    x: round(box.x),
    y: round(box.y),
    width: round(box.width),
    height: round(box.height),
  };
  if (object instanceof KritzelShape) {
    entry.shapeType = object.shapeType;
  }
  const name = object instanceof KritzelIframeObject ? object.name || object.title : object.name;
  if (name) {
    entry.name = name;
  }
  const rotation = normalizeDegrees(object.rotationDegrees);
  if (rotation !== 0) {
    entry.rotation = rotation;
  }
  if (object instanceof KritzelShape || object instanceof KritzelText) {
    const text = object.editor ? KritzelRichTextHelper.getPlainText(object.editor) : KritzelRichTextHelper.toPlainText(object.content);
    if (text) {
      entry.text = text.length > maxTextLength ? `${text.slice(0, maxTextLength)}…` : text;
    }
  }
  if (object instanceof KritzelGroup) {
    entry.childIds = [...object.childIds];
  }
  if (object instanceof KritzelLine) {
    if (object.startAnchor?.objectId) entry.from = object.startAnchor.objectId;
    if (object.endAnchor?.objectId) entry.to = object.endAnchor.objectId;
  }
  const style = describeStyle(object, theme);
  if (style) {
    entry.style = style;
  }
  if (object.userId) {
    entry.createdBy = object.userId;
  }
  return entry;
}

function describeStyle(object: AnyObject, theme: string): KritzelCanvasObject['style'] | undefined {
  const style: NonNullable<KritzelCanvasObject['style']> = {};
  if (object instanceof KritzelShape) {
    style.fillColor = colorOf(object.fillColor, theme);
    style.strokeColor = colorOf(object.strokeColor, theme);
    style.strokeWidth = object.strokeWidth;
    style.fontSize = object.fontSize;
    style.fontFamily = object.fontFamily;
    style.fontColor = colorOf(object.fontColor, theme);
  } else if (object instanceof KritzelText) {
    style.fontSize = object.fontSize;
    style.fontFamily = object.fontFamily;
    style.fontColor = colorOf(object.fontColor, theme);
  } else if (object instanceof KritzelPath) {
    style.strokeColor = colorOf(object.fill, theme);
    style.strokeWidth = object.strokeWidth;
  } else if (object instanceof KritzelLine) {
    style.strokeColor = colorOf(object.stroke, theme);
    style.strokeWidth = object.strokeWidth;
    const start = object.arrows?.start?.enabled ? object.arrows.start.style ?? 'triangle' : undefined;
    const end = object.arrows?.end?.enabled ? object.arrows.end.style ?? 'triangle' : undefined;
    if (start || end) {
      style.arrows = { ...(start ? { start } : {}), ...(end ? { end } : {}) };
    }
  }
  if (typeof object.opacity === 'number' && object.opacity !== 1) {
    style.opacity = object.opacity;
  }
  const entries = Object.entries(style).filter(([, value]) => value !== undefined && value !== '');
  return entries.length > 0 ? (Object.fromEntries(entries) as KritzelCanvasObject['style']) : undefined;
}

function typeOf(object: AnyObject): KritzelCanvasObject['type'] {
  if (object instanceof KritzelShape) return 'shape';
  if (object instanceof KritzelText) return 'text';
  if (object instanceof KritzelPath) return 'path';
  if (object instanceof KritzelLine) return 'line';
  if (object instanceof KritzelImage) return 'image';
  if (object instanceof KritzelIframeObject) return 'iframe';
  if (object instanceof KritzelGroup) return 'group';
  if (object instanceof KritzelDynamicObject) return 'custom';
  return 'object';
}

/** Old documents can hold plain color strings; never throw on them. */
function colorOf(color: ThemeAwareColor | string | undefined, theme: string): string | undefined {
  if (!color) {
    return undefined;
  }
  if (typeof color === 'string') {
    return color;
  }
  return (color as Record<string, string>)[theme] ?? color.light;
}

/**
 * Keeps the selected objects, then the visible ones, then the ones nearest to the viewport center; children only
 * with their group. A group counts as relevant as its most relevant descendant, and a child that comes up before
 * its group is kept as soon as the group is.
 */
function keepMostRelevant(
  objects: AnyObject[],
  max: number,
  selected: Set<string>,
  viewport: { x: number; y: number; width: number; height: number },
  parents: Map<string, KritzelGroup>,
): AnyObject[] {
  const cx = viewport.x + viewport.width / 2;
  const cy = viewport.y + viewport.height / 2;
  const present = new Set(objects.map(object => object.id));
  // A child whose group is not in the list (e.g. not asked for) stands on its own.
  const parentOf = (object: AnyObject): string | null => {
    const parent = parents.get(object.id);
    return parent && present.has(parent.id) ? parent.id : null;
  };
  const children = new Map<string, AnyObject[]>();
  objects.forEach(object => {
    const parentId = parentOf(object);
    if (parentId) {
      const list = children.get(parentId);
      if (list) {
        list.push(object);
      } else {
        children.set(parentId, [object]);
      }
    }
  });

  type Score = [rank: number, distance: number];
  const compare = (a: Score, b: Score): number => a[0] - b[0] || a[1] - b[1];
  const scores = new Map<string, Score>();
  const scoreOf = (object: AnyObject): Score => {
    const cached = scores.get(object.id);
    if (cached) {
      return cached;
    }
    const box = object.boundingBox;
    let score: Score = [
      selected.has(object.id) ? 0 : intersects(box, viewport) ? 1 : 2,
      Math.hypot(box.x + box.width / 2 - cx, box.y + box.height / 2 - cy),
    ];
    scores.set(object.id, score);
    for (const child of children.get(object.id) ?? []) {
      const childScore = scoreOf(child);
      if (compare(childScore, score) < 0) {
        score = childScore;
      }
    }
    scores.set(object.id, score);
    return score;
  };

  const sorted = [...objects].sort((a, b) => compare(scoreOf(a), scoreOf(b)));
  const kept = new Set<string>();
  const waiting = new Map<string, AnyObject[]>();
  const result: AnyObject[] = [];
  const keep = (object: AnyObject): void => {
    if (result.length >= max || kept.has(object.id)) {
      return;
    }
    kept.add(object.id);
    result.push(object);
    // Children that came up before their group follow it now, most relevant first.
    const parked = waiting.get(object.id) ?? [];
    waiting.delete(object.id);
    parked.forEach(keep);
  };
  for (const object of sorted) {
    if (result.length >= max) {
      break;
    }
    const parentId = parentOf(object);
    if (parentId && !kept.has(parentId)) {
      const list = waiting.get(parentId);
      if (list) {
        list.push(object);
      } else {
        waiting.set(parentId, [object]);
      }
      continue;
    }
    keep(object);
  }
  return result;
}

function getMap(core: KritzelCore): KritzelObjectMap<AnyObject> | null {
  try {
    const map = core.store.objects as KritzelObjectMap<AnyObject> | undefined;
    return map && map.isReady && !map.isHeadless ? map : null;
  } catch {
    return null;
  }
}

function hasFiniteBox(object: AnyObject): boolean {
  const box = object.boundingBox;
  return [box.x, box.y, box.width, box.height].every(value => Number.isFinite(value));
}

function intersects(box: { x: number; y: number; width: number; height: number }, area: { x: number; y: number; width: number; height: number }): boolean {
  return box.x < area.x + area.width && box.x + box.width > area.x && box.y < area.y + area.height && box.y + box.height > area.y;
}

function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  const normalized = Math.round(((degrees % 360) + 360) % 360);
  return normalized === 360 ? 0 : normalized;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
