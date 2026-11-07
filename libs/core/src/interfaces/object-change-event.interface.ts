import { KritzelBaseObject } from '../classes/objects/base-object.class';
import type { KritzelAgenticActionType } from './agentic-action.interface';

/** A change made by a `KritzelAgent`. */
export interface KritzelAgentChangeSource {
    type: 'agent';
    /** ID of the agent that made the change. */
    agentId: string;
    /** The action that made the change; `'undo'` or `'redo'` for the agent's own history. */
    actionType: KritzelAgenticActionType;
}

/**
 * Who made an object change. Absent for changes by the local user, collaborators,
 * sync and the user's undo/redo.
 */
export type KritzelObjectChangeSource = KritzelAgentChangeSource;

/**
 * Emitted when one or more objects are added to the canvas.
 */
export interface ObjectsAddedEvent {
    objects: KritzelBaseObject[];
    /** Set when an agent made the change. */
    source?: KritzelObjectChangeSource;
}

/**
 * Emitted when one or more objects are removed from the canvas.
 * Contains snapshots of the objects before removal.
 */
export interface ObjectsRemovedEvent {
    objects: KritzelBaseObject[];
    /** Set when an agent made the change. */
    source?: KritzelObjectChangeSource;
}

/**
 * Emitted when one or more objects are updated on the canvas.
 * Each entry contains the updated object and the list of changed property keys.
 */
export interface ObjectsUpdatedEvent {
    objects: { object: KritzelBaseObject; changedProperties: string[] }[];
    /** Set when an agent made the change. */
    source?: KritzelObjectChangeSource;
}

/**
 * Payload emitted when the set of objects visible in the current viewport changes
 * (e.g., after a pan or zoom).
 * Kept as a named alias so wrapper proxy generators don't try to import
 * the DOM global `Element` from `@kritzel/engine` (which causes TS2749).
 */
export type ObjectsInViewportChangeEvent = KritzelBaseObject<Element>[];
