import type { KritzelAgenticClickAction } from '../interfaces/agentic-action.interface';
import type { KritzelPoint } from '../interfaces/point.interface';
import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import type { KritzelObjectMap } from '../classes/structures/object-map.structure';
import { KritzelZOrderHelper } from '../helpers/z-order.helper';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import { findParentGroup, isSelectionObject } from '../helpers/agentic-conflict.helper';
import { isPointInCorners } from '../helpers/agentic-geometry.helper';
import { assertTarget, isObjectTarget } from '../helpers/agentic-validation.helper';

type ObjectMap = KritzelObjectMap<KritzelBaseObject<any>>;

/** The top-most visible top-level object at a world point, or `null`. */
export function hitTestTopMost(map: ObjectMap, point: KritzelPoint): KritzelBaseObject<any> | null {
  const hits = map
    .filter(object => {
      if (isSelectionObject(object) || object.isVisible === false) {
        return false;
      }
      const polygon = object.rotatedPolygon;
      const corners = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
      return isPointInCorners(point, corners) && object.hitTest(point.x, point.y);
    })
    .sort(KritzelZOrderHelper.compareStackOrder);
  let hit = hits.length > 0 ? hits[hits.length - 1] : null;
  // Clicks select whole groups, like the selection tool.
  const seen = new Set<string>();
  while (hit && !seen.has(hit.id)) {
    seen.add(hit.id);
    const parent = findParentGroup(map, hit.id);
    if (!parent) {
      break;
    }
    hit = parent;
  }
  return hit;
}

/** `click`: flies to the target and presses. Visual only. */
export const clickExecutor: KritzelAgenticActionExecutor<KritzelAgenticClickAction> = {
  mutates: false,

  validate(action) {
    assertTarget(action.target, 'target');
    if (action.count !== undefined && action.count !== 1 && action.count !== 2) {
      throw new TypeError('"count" must be 1 or 2.');
    }
  },

  prepare(run, action) {
    if (isObjectTarget(action.target)) {
      const object = run.map!.findById(action.target.objectId);
      if (!object || isSelectionObject(object)) {
        return { reason: 'invalid-target', objectIds: [action.target.objectId] };
      }
      return { targetIds: [], referenceIds: [action.target.objectId], checkLevel: 'existence' };
    }
    return { targetIds: [], referenceIds: [], checkLevel: 'existence' };
  },

  async execute(run, action) {
    const attach = isObjectTarget(action.target);
    await run.fly(action.target, attach);
    const count = action.count ?? 1;
    for (let i = 0; i < count; i++) {
      await run.click();
    }
    if (isObjectTarget(action.target)) {
      run.finalAttachment = { objectId: action.target.objectId, anchor: action.target.anchor ?? 'center', offset: action.target.offset };
    }
    const point = run.cursorManager.resolveTarget(action.target);
    const hit = point ? hitTestTopMost(run.map!, point) : null;
    return hit ? [hit.id] : [];
  },
};
