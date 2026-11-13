import type { UpdrawAgenticEditLineAction } from '../../interfaces/agentic-action.interface';
import { UpdrawLine } from '../objects/line.class';
import type { UpdrawAgenticActionExecutor } from '../../types/agentic-action.types';
import { assertObjectId } from '../../helpers/agentic-validation.helper';
import { prepareTopLevelTargets } from './select.executor';
import { assertLineEnd, assertOptionalPoint, bendLine, dragLineEnd, isObjectEnd, LINE_GEOMETRY_PROPERTIES, refuseUnanchorable } from './line-handles';

/**
 * `editLine`: changes a line with its handles, like the user does: drags the start, then the end (detaching an
 * end on the way and attaching it to an object on release), then the middle handle to bend or straighten it.
 */
export const editLineExecutor: UpdrawAgenticActionExecutor<UpdrawAgenticEditLineAction> = {
  mutates: true,

  validate(action) {
    assertObjectId(action.lineId, 'lineId');
    if (action.from !== undefined) assertLineEnd(action.from, 'from');
    if (action.to !== undefined) assertLineEnd(action.to, 'to');
    assertOptionalPoint(action.through, 'through');
    if (action.straight !== undefined && typeof action.straight !== 'boolean') {
      throw new TypeError('"straight" must be a boolean.');
    }
    if (action.through !== undefined && action.straight) {
      throw new TypeError('Give "through" or "straight", not both.');
    }
    if (action.from === undefined && action.to === undefined && action.through === undefined && !action.straight) {
      throw new TypeError('Give at least one of "from", "to", "through" or "straight".');
    }
  },

  prepare(run, action) {
    const preparation = prepareTopLevelTargets(run, [action.lineId]);
    if ('reason' in preparation) {
      return preparation;
    }
    const line = run.map!.findById(action.lineId);
    if (!(line instanceof UpdrawLine)) {
      return { reason: 'invalid-target', objectIds: [action.lineId] };
    }
    const objectIds = [action.from, action.to].filter(end => end !== undefined && isObjectEnd(end)).map(end => (end as { objectId: string }).objectId);
    for (const id of objectIds) {
      const refusal = refuseUnanchorable(run, id, action.lineId);
      if (refusal) {
        return refusal;
      }
    }
    // Both ends can't sit on the same object (an end that is not moved keeps its anchor).
    const startObject = action.from ? (isObjectEnd(action.from) ? action.from.objectId : undefined) : line.startAnchor?.objectId;
    const endObject = action.to ? (isObjectEnd(action.to) ? action.to.objectId : undefined) : line.endAnchor?.objectId;
    if (startObject !== undefined && startObject === endObject) {
      return { reason: 'invalid-target', objectIds: [startObject] };
    }
    return { ...preparation, referenceIds: objectIds };
  },

  async execute(run, action) {
    const id = action.lineId;
    if (action.from) {
      await dragLineEnd(run, id, 'start', action.from);
    }
    if (action.to) {
      await dragLineEnd(run, id, 'end', action.to);
    }
    if (action.through || action.straight) {
      await bendLine(run, id, action.through);
    }
    run.changedProperties.set(id, LINE_GEOMETRY_PROPERTIES);
    run.finalAttachment = { objectId: id, anchor: 'center' };
    return [id];
  },
};
