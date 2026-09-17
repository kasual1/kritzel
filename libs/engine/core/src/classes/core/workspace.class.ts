import { KritzelSerializable } from "../../interfaces/serializable.interface";
import { ObjectHelper } from "../../helpers/object.helper";
import type { KritzelCore } from "./core.class";
import type { KritzelBaseObject } from "../objects/base-object.class";

/** Current version of the workspace export format */
export const WORKSPACE_EXPORT_VERSION = '1.3.0';

/**
 * Configuration options for creating a KritzelWorkspace instance.
 */
export interface KritzelWorkspaceConfig {
  /** Unique identifier for the workspace. Auto-generated if omitted. */
  id?: string;
  /** Display name of the workspace. Defaults to 'New Workspace' if omitted. */
  name?: string;
  /** Initial viewport configuration containing world-space center coordinates and scale */
  viewport?: {
    centerWorldX?: number;
    centerWorldY?: number;
    scale?: number;
  };
  /**
   * Canvas objects for this workspace. Seeded on first initialization, and treated as the
   * desired object set by `updateWorkspace()`. Omit to leave existing objects untouched.
   */
  objects?: KritzelBaseObject<any>[];
}

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
  /**
   * Desired canvas objects. Seeded when the workspace is first initialized and applied as the
   * full desired set by `updateWorkspace()`: `undefined` leaves objects untouched, `[]` removes all.
   */
  objects?: KritzelBaseObject<any>[];

  /** Whether the workspace is publicly accessible via a share link */
  isPublic: boolean;

  /** Reference to the KritzelCore instance managing this workspace */
  _core!: KritzelCore;

  /**
   * Creates a new KritzelWorkspace instance.
   * @param config - Configuration options object for the workspace
   */
  constructor(config?: KritzelWorkspaceConfig) {
    this.id = config?.id ?? ObjectHelper.generateUUID();
    this.name = config?.name ?? 'New Workspace';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.viewport = {
      centerWorldX: config?.viewport?.centerWorldX ?? 0,
      centerWorldY: config?.viewport?.centerWorldY ?? 0,
      scale: config?.viewport?.scale ?? 1,
    };
    this.objects = config?.objects;
    this.isPublic = false;
  }

  /**
   * Factory method to create a workspace with a core reference.
   * @param core - The KritzelCore instance to associate with this workspace
   * @param obj - Object containing workspace properties (id, name, viewport)
   * @returns A new KritzelWorkspace instance with the core reference set
   */
  static create(core: KritzelCore, obj: any): KritzelWorkspace {
    const workspace = new KritzelWorkspace({
      id: obj.id,
      name: obj.name,
      viewport: obj.viewport,
    });
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
