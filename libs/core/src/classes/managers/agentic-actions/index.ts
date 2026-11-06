import type { KritzelAgenticAction, KritzelAgenticActionType } from '../../../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import { clickExecutor } from './click.executor';
import { clearSelectionExecutor, selectExecutor } from './select.executor';
import { moveObjectExecutor } from './move-object.executor';
import { deleteObjectsExecutor } from './delete-objects.executor';
import { redoExecutor, undoExecutor } from './history.executor';

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
};

/** The executor for an action type, or `null` for unknown types. */
export function getAgenticActionExecutor(type: unknown): KritzelAgenticActionExecutor | null {
  if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(AGENTIC_ACTION_EXECUTORS, type)) {
    return null;
  }
  return AGENTIC_ACTION_EXECUTORS[type as KritzelAgenticActionType] as unknown as KritzelAgenticActionExecutor;
}
