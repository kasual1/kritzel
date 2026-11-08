import type { KritzelAgenticObjectStyle, KritzelAgenticSetStyleAction } from '../interfaces/agentic-action.interface';
import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelShape } from '../classes/objects/shape.class';
import { KritzelText } from '../classes/objects/text.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelLine } from '../classes/objects/line.class';
import { KritzelGroup } from '../classes/objects/group.class';
import { AGENTIC_ACTION_MOUNT_WAIT_FRAMES, type KritzelAgenticActionExecutor } from './agentic-action.types';
import { collectWithDescendants } from '../helpers/agentic-conflict.helper';
import { toThemeColor } from '../helpers/agentic-style.helper';
import { flyToObjects, prepareTopLevelTargets } from './select.executor';
import { AGENTIC_OBJECT_STYLE_KEYS, assertObjectIds, assertStyle, uniqueIds } from '../helpers/agentic-validation.helper';

type AnyObject = KritzelBaseObject<any>;

/** The object properties a style sets on one object; fields that don't apply to its type are left out. */
export function stylePatchFor(object: AnyObject, style: KritzelAgenticObjectStyle): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (style.opacity !== undefined) {
    patch.opacity = style.opacity;
  }
  if (object instanceof KritzelShape) {
    if (style.fillColor !== undefined) patch.fillColor = toThemeColor(style.fillColor);
    if (style.strokeColor !== undefined) patch.strokeColor = toThemeColor(style.strokeColor);
    if (style.strokeWidth !== undefined) patch.strokeWidth = style.strokeWidth;
    if (style.fontSize !== undefined) patch.fontSize = style.fontSize;
    if (style.fontFamily !== undefined) patch.fontFamily = style.fontFamily;
    if (style.fontColor !== undefined) patch.fontColor = toThemeColor(style.fontColor);
  } else if (object instanceof KritzelText) {
    if (style.fontSize !== undefined) patch.fontSize = style.fontSize;
    if (style.fontFamily !== undefined) patch.fontFamily = style.fontFamily;
    if (style.fontColor !== undefined) patch.fontColor = toThemeColor(style.fontColor);
  } else if (object instanceof KritzelPath) {
    if (style.strokeColor !== undefined) patch.fill = toThemeColor(style.strokeColor);
    if (style.strokeWidth !== undefined) patch.strokeWidth = style.strokeWidth;
  } else if (object instanceof KritzelLine) {
    if (style.strokeColor !== undefined) patch.stroke = toThemeColor(style.strokeColor);
    if (style.strokeWidth !== undefined) patch.strokeWidth = style.strokeWidth;
    if (style.arrows !== undefined) {
      // Per end: an end the style leaves out keeps its arrow head. Copies, so the line shares nothing with the action.
      const arrows = { ...(object.arrows ?? {}) };
      if (style.arrows.start !== undefined) arrows.start = { ...style.arrows.start };
      if (style.arrows.end !== undefined) arrows.end = { ...style.arrows.end };
      patch.arrows = arrows;
    }
  }
  return patch;
}

/**
 * Applies a patch like `core.updateObject()`. A shape derives its font color from a new fill color,
 * so an explicit font color is applied after the fill.
 */
function applyPatch(object: AnyObject, patch: Record<string, unknown>): void {
  const { fontColor, ...rest } = patch;
  const keys = Object.keys(rest);
  Object.assign(object, rest);
  object.onAfterUpdate(keys);
  if (fontColor !== undefined) {
    (object as unknown as { fontColor: unknown }).fontColor = fontColor;
    object.onAfterUpdate(['fontColor']);
  }
}

/** `setStyle`: clicks the objects and restyles them; groups style their children. */
export const setStyleExecutor: KritzelAgenticActionExecutor<KritzelAgenticSetStyleAction> = {
  mutates: true,

  validate(action) {
    assertObjectIds(action.objectIds, 'objectIds');
    assertStyle(action.style, 'style', AGENTIC_OBJECT_STYLE_KEYS, { required: true });
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, action.objectIds);
    if ('reason' in preparation) {
      return preparation;
    }
    const map = run.map!;
    const applies = Array.from(collectWithDescendants(map, preparation.targetIds)).some(id => {
      const object = map.findById(id);
      return !!object && !(object instanceof KritzelGroup) && Object.keys(stylePatchFor(object, action.style)).length > 0;
    });
    return applies ? preparation : { reason: 'invalid-target', objectIds: preparation.targetIds };
  },

  async execute(run, action) {
    const ids = uniqueIds(action.objectIds);
    const map = run.map!;
    const core = run.core;
    await flyToObjects(run, ids);
    await run.click();

    const remeasure: string[] = [];
    run.mutate(() => {
      for (const id of collectWithDescendants(map, ids)) {
        const object = map.findById(id);
        if (!object || object instanceof KritzelGroup) {
          continue;
        }
        const patch = stylePatchFor(object, action.style);
        const keys = Object.keys(patch);
        if (keys.length === 0) {
          continue;
        }
        applyPatch(object, patch);
        map.update(object);
        run.changedProperties.set(id, keys);
        if (object instanceof KritzelText && (patch.fontSize !== undefined || patch.fontFamily !== undefined)) {
          remeasure.push(id);
        }
      }
    });
    run.assertActive();

    // Text sizes come from the DOM: measure on-screen texts again once they rendered the new font.
    const visible = remeasure.filter(id => (map.findById(id) as KritzelText | undefined)?.isInViewport());
    if (visible.length > 0) {
      core.rerender();
      for (let frame = 0; frame < AGENTIC_ACTION_MOUNT_WAIT_FRAMES; frame++) {
        await run.nextRenderedFrame();
        if (visible.every(id => (map.findById(id) as KritzelText | undefined)?.isMounted)) {
          break;
        }
      }
      run.mutate(() => {
        for (const id of visible) {
          const text = map.findById(id) as KritzelText | undefined;
          if (text) {
            text.adjustSizeOnInput();
            map.update(text);
          }
        }
      });
    }

    run.finalAttachment = { objectId: ids[0], anchor: 'center' };
    return ids;
  },
};
