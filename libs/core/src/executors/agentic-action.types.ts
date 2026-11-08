import type { KritzelAgenticAction, KritzelAgenticActionFailureReason } from '../interfaces/agentic-action.interface';
import type { KritzelAgenticActionRun } from '../classes/managers/agentic-action-run.class';

/** Press duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_PRESS_MS = 90;
/** Release duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_RELEASE_MS = 90;
/** Drag speed in screen pixels per second at the default speed. */
export const AGENTIC_ACTION_DRAG_SPEED = 600;
/** Minimum drag duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_DRAG_MIN_MS = 250;
/** Maximum drag duration in milliseconds at the default speed. */
export const AGENTIC_ACTION_DRAG_MAX_MS = 1500;
/** Interval of throttled Yjs writes during animated changes (same as SelectionGroup's child persist throttle). */
export const AGENTIC_ACTION_PERSIST_INTERVAL_MS = 100;
/** The default speed; `speed / AGENTIC_ACTION_DEFAULT_SPEED` scales all non-flight phases. */
export const AGENTIC_ACTION_DEFAULT_SPEED = 1200;
/** Rotation speed in degrees per second at the default speed (clamped to 300..1500 ms). */
export const AGENTIC_ACTION_ROTATE_SPEED = 180;
/** Drawing speed in screen pixels per second along the path at the default speed (clamped to 250..4000 ms). */
export const AGENTIC_ACTION_DRAW_SPEED = 900;
/** Typing speed in characters per second at the default speed. */
export const AGENTIC_ACTION_TYPING_CPS = 25;
/** Screen distance of the rotation handle above an object's top edge, without titlebars. */
export const AGENTIC_ACTION_ROTATION_HANDLE_PX = 15;
/** Frames a created text waits to be mounted so its size can be measured. */
export const AGENTIC_ACTION_MOUNT_WAIT_FRAMES = 10;

/** What an action works on, determined before it starts. */
export interface KritzelAgenticPreparation {
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
export interface KritzelAgenticRefusal {
  reason: KritzelAgenticActionFailureReason;
  objectIds?: string[];
}

/** Implements one action type. */
export interface KritzelAgenticActionExecutor<A extends KritzelAgenticAction = KritzelAgenticAction> {
  /** Whether the action changes objects (then it gets an undo step, rollback and events). */
  readonly mutates: boolean;
  /** Throws a `TypeError` for structurally invalid actions. */
  validate(action: A): void;
  /** Resolves the targets, or refuses the action. Runs right before the action starts. */
  prepare(run: KritzelAgenticActionRun, action: A): KritzelAgenticPreparation | KritzelAgenticRefusal;
  /** Performs the action. Resolves with the result object IDs. */
  execute(run: KritzelAgenticActionRun, action: A): Promise<string[]>;
}

/** Thrown inside an action once it has settled (aborted or interrupted); executors let it propagate. */
export class KritzelAgenticAbortError extends Error {
  constructor() {
    super('Agentic action was stopped.');
    this.name = 'KritzelAgenticAbortError';
  }
}

/** Whether a preparation result is a refusal. */
export function isAgenticRefusal(value: KritzelAgenticPreparation | KritzelAgenticRefusal): value is KritzelAgenticRefusal {
  return typeof (value as KritzelAgenticRefusal).reason === 'string';
}
