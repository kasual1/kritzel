import { UpdrawBaseObject } from '../classes/objects/base-object.class';
import type { UpdrawAgenticActionType } from './agentic-action.interface';

/** A change made by an `UpdrawAgent`. */
export interface UpdrawAgentChangeSource {
    type: 'agent';
    /** ID of the agent that made the change. */
    agentId: string;
    /** The action that made the change; `'undo'` or `'redo'` for the agent's own history. */
    actionType: UpdrawAgenticActionType;
}

/**
 * Who made an object change. Absent for changes by the local user, collaborators,
 * sync and the user's undo/redo.
 */
export type UpdrawObjectChangeSource = UpdrawAgentChangeSource;

/**
 * Emitted when one or more objects are added to the canvas.
 */
export interface ObjectsAddedEvent {
    objects: UpdrawBaseObject[];
    /** Set when an agent made the change. */
    source?: UpdrawObjectChangeSource;
}

/**
 * Emitted when one or more objects are removed from the canvas.
 * Contains snapshots of the objects before removal.
 */
export interface ObjectsRemovedEvent {
    objects: UpdrawBaseObject[];
    /** Set when an agent made the change. */
    source?: UpdrawObjectChangeSource;
}

/**
 * Emitted when one or more objects are updated on the canvas.
 * Each entry contains the updated object and the list of changed property keys.
 */
export interface ObjectsUpdatedEvent {
    objects: { object: UpdrawBaseObject; changedProperties: string[] }[];
    /** Set when an agent made the change. */
    source?: UpdrawObjectChangeSource;
}

/**
 * Payload emitted when the set of objects visible in the current viewport changes
 * (e.g., after a pan or zoom).
 * Kept as a named alias so wrapper proxy generators don't try to import
 * the DOM global `Element` from `@updraw/engine` (which causes TS2749).
 */
export type ObjectsInViewportChangeEvent = UpdrawBaseObject<Element>[];
