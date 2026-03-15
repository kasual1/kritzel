import { KritzelBaseObject } from '../classes/objects/base-object.class';

/**
 * Emitted when one or more objects are added to the canvas.
 */
export interface ObjectsAddedEvent {
    objects: KritzelBaseObject[];
}

/**
 * Emitted when one or more objects are removed from the canvas.
 * Contains snapshots of the objects before removal.
 */
export interface ObjectsRemovedEvent {
    objects: KritzelBaseObject[];
}

/**
 * Emitted when one or more objects are updated on the canvas.
 * Each entry contains the updated object and the list of changed property keys.
 */
export interface ObjectsUpdatedEvent {
    objects: { object: KritzelBaseObject; changedProperties: string[] }[];
}
