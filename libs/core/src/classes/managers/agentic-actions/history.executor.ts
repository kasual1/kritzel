import type { KritzelAgenticRedoAction, KritzelAgenticUndoAction } from '../../../interfaces/agentic-action.interface';
import type { KritzelAgenticActionExecutor } from './agentic-action.types';
import type { KritzelAgenticActionRun } from './agentic-action-run.class';
import { flyToObjects } from './select.executor';

type HistoryAction = KritzelAgenticUndoAction | KritzelAgenticRedoAction;

function createHistoryExecutor(direction: 'undo' | 'redo'): KritzelAgenticActionExecutor<HistoryAction> {
  const emptyReason = direction === 'undo' ? 'nothing-to-undo' : 'nothing-to-redo';

  return {
    // The map's agent history applies the change itself; no capture or rollback is needed.
    mutates: false,

    validate() {
      // Nothing to validate.
    },

    prepare(run: KritzelAgenticActionRun) {
      const map = run.map!;
      const state = map.getAgentUndoState(run.cursorId);
      if (direction === 'undo' ? !state.canUndo : !state.canRedo) {
        return { reason: emptyReason };
      }
      // Objects the step touched that still exist are checked, so agent history never
      // changes objects the user or a collaborator is working on.
      const ids = map.peekAgentObjectIds(run.cursorId, direction).filter(id => !!map.findById(id));
      return { targetIds: ids, referenceIds: [] };
    },

    async execute(run: KritzelAgenticActionRun) {
      const map = run.map!;
      if (run.displayIds.length > 0) {
        await flyToObjects(run, run.displayIds);
      }
      await run.click();
      run.host.checkpoint(run);

      // The step replaces the instances of its objects; stop checking them as "changed elsewhere".
      run.untrack([...run.targetIds]);
      const result = direction === 'undo' ? map.undoAgent(run.cursorId) : map.redoAgent(run.cursorId);
      if (result.status === 'empty') {
        run.stop(emptyReason);
      }
      if (result.status === 'conflict') {
        run.stop('conflict', result.objectIds);
      }
      return result.objectIds;
    },
  };
}

/** `undo`: undoes this agent's last completed action. */
export const undoExecutor = createHistoryExecutor('undo');

/** `redo`: redoes this agent's last undone action. */
export const redoExecutor = createHistoryExecutor('redo');
