import type { KritzelAgenticAction, KritzelAgenticActionType } from '../../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from '../../types/agentic-action.types';
import { clickExecutor } from '../executors/click.executor';
import { clearSelectionExecutor, selectExecutor } from '../executors/select.executor';
import { moveObjectExecutor } from '../executors/move-object.executor';
import { deleteObjectsExecutor } from '../executors/delete-objects.executor';
import { redoExecutor, undoExecutor } from '../executors/history.executor';
import { resizeObjectExecutor } from '../executors/resize-object.executor';
import { rotateObjectExecutor } from '../executors/rotate-object.executor';
import { copyObjectsExecutor } from '../executors/copy-objects.executor';
import { groupObjectsExecutor, ungroupObjectsExecutor } from '../executors/group-objects.executor';
import { orderObjectsExecutor } from '../executors/order-objects.executor';
import { createShapeExecutor } from '../executors/create-shape.executor';
import { createTextExecutor } from '../executors/create-text.executor';
import { typeTextExecutor } from '../executors/type-text.executor';
import { drawPathExecutor } from '../executors/draw-path.executor';
import { connectExecutor } from '../executors/connect.executor';
import { drawLineExecutor } from '../executors/draw-line.executor';
import { editLineExecutor } from '../executors/edit-line.executor';
import { setStyleExecutor } from '../executors/set-style.executor';
import { addObjectExecutor } from '../executors/add-object.executor';

/**
 * One executor per action type. The mapped type makes the build fail when an action type
 * is added to the union without an executor.
 */
export const AGENTIC_ACTION_EXECUTORS: {
  [K in KritzelAgenticActionType]: KritzelAgenticActionExecutor<Extract<KritzelAgenticAction, { type: K }>>;
} = {
  click: clickExecutor,
  select: selectExecutor,
  clearSelection: clearSelectionExecutor,
  moveObject: moveObjectExecutor,
  deleteObjects: deleteObjectsExecutor,
  undo: undoExecutor,
  redo: redoExecutor,
  resizeObject: resizeObjectExecutor,
  rotateObject: rotateObjectExecutor,
  copyObjects: copyObjectsExecutor,
  groupObjects: groupObjectsExecutor,
  ungroupObjects: ungroupObjectsExecutor,
  orderObjects: orderObjectsExecutor,
  createShape: createShapeExecutor,
  createText: createTextExecutor,
  typeText: typeTextExecutor,
  drawPath: drawPathExecutor,
  connect: connectExecutor,
  drawLine: drawLineExecutor,
  editLine: editLineExecutor,
  setStyle: setStyleExecutor,
  addObject: addObjectExecutor,
};

/** The executor for an action type, or `null` for unknown types. */
export function getAgenticActionExecutor(type: unknown): KritzelAgenticActionExecutor | null {
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(AGENTIC_ACTION_EXECUTORS, type)) {
    return null;
  }
  return AGENTIC_ACTION_EXECUTORS[type as KritzelAgenticActionType] as unknown as KritzelAgenticActionExecutor;
}
