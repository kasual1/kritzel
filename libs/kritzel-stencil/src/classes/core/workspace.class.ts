import { KritzelSerializable } from "../../interfaces/serializable.interface";
import type { KritzelCore } from "./core.class";

/** Current version of the workspace export format */
export const WORKSPACE_EXPORT_VERSION = '1.2.0';

/**
 * Represents a workspace in the Kritzel canvas.
 * A workspace is an isolated canvas area with its own set of objects and viewport state.
 * It can be serialized and deserialized for persistence and collaborative editing.
 */
export class KritzelWorkspace implements KritzelSerializable {
  __class__ = 'KritzelWorkspace';

  /** Unique identifier for the workspace */
  id: string;
  /** Display name of the workspace */
  name: string;
  /** Timestamp when the workspace was created */
  createdAt: Date;
  /** Timestamp when the workspace was last updated */
  updatedAt: Date;
  /** Viewport state containing the world-space center point and zoom level */
  viewport: {
    centerWorldX: number;
    centerWorldY: number;
    scale: number;
  };

  /** Whether the workspace is publicly accessible via a share link */
  isPublic: boolean;

  /** Reference to the KritzelCore instance managing this workspace */
  _core: KritzelCore;

  /**
   * Creates a new KritzelWorkspace instance.
   * @param id - Unique identifier for the workspace
   * @param name - Display name of the workspace
   * @param viewport - Initial viewport state with centerWorldX, centerWorldY, and scale values
   */
  constructor(id: string, name: string, viewport: { centerWorldX: number; centerWorldY: number; scale: number } = { centerWorldX: 0, centerWorldY: 0, scale: 1 }) {
    this.id = id;
    this.name = name;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.viewport = viewport;
    this.isPublic = false;
  }

  /**
   * Factory method to create a workspace with a core reference.
   * @param core - The KritzelCore instance to associate with this workspace
   * @param obj - Object containing workspace properties (id, name, viewport)
   * @returns A new KritzelWorkspace instance with the core reference set
   */
  static create(core: KritzelCore, obj): KritzelWorkspace {
    const workspace = new KritzelWorkspace(obj.id, obj.name, obj.viewport);
    workspace._core = core;
    return workspace;
  }

  /**
   * Adds an object to this workspace via the core engine.
   * @param obj - The object to add to the workspace
   */
  addObject(obj: any): void {
    this._core.engine.addObject(obj);
  }

  /**
   * Serializes the workspace to a plain object for storage or transmission.
   * Converts dates to ISO strings and includes the class identifier.
   * @param options - Optional settings for serialization
   * @param options.includeObjects - If true, includes all canvas objects in the serialized output
   * @returns A plain object representation of the workspace
   */
  serialize(options?: { includeObjects?: boolean }): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      __class__: this.__class__,
      version: WORKSPACE_EXPORT_VERSION,
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      viewport: this.viewport,
      isPublic: this.isPublic,
    };

    if (options?.includeObjects && this._core) {
      const allObjects = this._core.store.allNonSelectionObjects;
      serialized.objects = allObjects.map(obj => obj.serialize());
    }

    return serialized;
  }

  /**
   * Creates a shallow clone of this workspace, preserving the prototype chain.
   * Useful when Stencil needs a new object reference to detect property changes.
   */
  clone(): KritzelWorkspace {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  /**
   * Deserializes a plain object into this workspace instance.
   * Converts ISO string dates back to Date objects.
   * @param object - The plain object to deserialize from
   * @returns This workspace instance with updated properties
   */
  deserialize(object: any): KritzelSerializable {
    Object.assign(this, object);
    this.createdAt = new Date(object.createdAt);
    this.updatedAt = new Date(object.updatedAt);
    return this;
  }
}
