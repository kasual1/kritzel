import type { UpmadeAgenticAction, UpmadeAgenticActionFailureReason } from '../interfaces/agentic-action.interface';
import type { UpmadeAgenticActionRun } from '../classes/managers/agentic-action-run.class';

/** What an action works on, determined before it starts. */
export interface UpmadeAgenticPreparation {
  /** Objects the action selects or changes: full conflict checks, claimed, shown as selected. */
  targetIds: string[];
  /** Objects the action only reads (e.g. a `moveObject` destination): must exist and not be changed by another agent. */
  referenceIds: string[];
  /** Whether lines anchored to the targets are checked too (actions that move or delete targets). */
  includeAnchoredLines?: boolean;
  /** `'existence'` only checks that the targets exist (used by `click`). Defaults to `'full'`. */
  checkLevel?: 'full' | 'existence';
}

/** A refusal decided before the action starts. */
export interface UpmadeAgenticRefusal {
  reason: UpmadeAgenticActionFailureReason;
  objectIds?: string[];
}

/** Implements one action type. */
export interface UpmadeAgenticActionExecutor<A extends UpmadeAgenticAction = UpmadeAgenticAction> {
  /** Whether the action changes objects (then it gets an undo step, rollback and events). */
  readonly mutates: boolean;
  /** Throws a `TypeError` for structurally invalid actions. */
  validate(action: A): void;
  /** Resolves the targets, or refuses the action. Runs right before the action starts. */
  prepare(run: UpmadeAgenticActionRun, action: A): UpmadeAgenticPreparation | UpmadeAgenticRefusal;
  /** Performs the action. Resolves with the result object IDs. */
  execute(run: UpmadeAgenticActionRun, action: A): Promise<string[]>;
}
