import type {
  KritzelAgenticAction,
  KritzelAgenticActionFailureReason,
  KritzelAgenticActionResult,
} from '../../interfaces/agentic-action.interface';

/**
 * Thrown inside `agent.task()` when an action of the agent does not complete,
 * e.g. because the user has the target selected (`reason: 'user-selected'`).
 */
export class KritzelAgentActionError extends Error {
  readonly name = 'KritzelAgentActionError';

  constructor(
    /** The action that did not complete. */
    readonly action: KritzelAgenticAction,
    /** Its result (`completed: false`). */
    readonly result: KritzelAgenticActionResult,
  ) {
    super(`Agent action "${action.type}" did not complete: ${result.reason ?? 'unknown reason'}.`);
  }

  /** Why the action did not complete. */
  get reason(): KritzelAgenticActionFailureReason | undefined {
    return this.result.reason;
  }

  /** The objects that caused it, when known. */
  get objectIds(): string[] {
    return this.result.objectIds ?? [];
  }
}
