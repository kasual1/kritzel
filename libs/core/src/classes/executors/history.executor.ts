import type { UpdrawAgenticRedoAction, UpdrawAgenticUndoAction } from '../../interfaces/agentic-action.interface';
import type { UpdrawAgenticActionExecutor } from '../../types/agentic-action.types';
import type { UpdrawAgenticActionRun } from '../managers/agentic-action-run.class';
import type { UpdrawAgentHistoryResult } from '../structures/object-map.structure';
import { flyToObjects } from './select.executor';

type HistoryAction = UpdrawAgenticUndoAction | UpdrawAgenticRedoAction;

function createHistoryExecutor(direction: 'undo' | 'redo'): UpdrawAgenticActionExecutor<HistoryAction> {
  const emptyReason = direction === 'undo' ? 'nothing-to-undo' : 'nothing-to-redo';

  return {
    // The map's agent history applies the change itself; no capture or rollback is needed.
    mutates: false,

    validate() {
      // Nothing to validate.
    },

    prepare(run: UpdrawAgenticActionRun) {
      // Actors working as the user share the user's history; they never undo or redo on their own.
      if (run.actorKind === 'user') {
        return { reason: 'not-allowed' as const };
      }
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

    async execute(run: UpdrawAgenticActionRun) {
      const map = run.map!;
      if (run.displayIds.length > 0) {
        await flyToObjects(run, run.displayIds);
      }
      await run.click();
      run.host.checkpoint(run);

      // The step replaces the instances of its objects; stop checking them as "changed elsewhere".
      run.untrack([...run.targetIds]);
      run.applyingHistory = true;
      let result: UpdrawAgentHistoryResult;
      try {
        result = direction === 'undo' ? map.undoAgent(run.cursorId) : map.redoAgent(run.cursorId);
      } finally {
        run.applyingHistory = false;
      }
      // An abort during the step (e.g. from a listener of its events) only stands if nothing was applied.
      const held = run.heldAbort;
      run.heldAbort = null;
      if (held && result.status !== 'done') {
        run.stop(held.reason, held.objectIds);
      }
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
