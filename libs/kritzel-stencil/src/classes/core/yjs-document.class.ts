import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelReviver } from './reviver.class';
import { KritzelCore } from './core.class';

/**
 * Manages Yjs document and provides CRDT-based storage for workspaces and objects
 * with IndexedDB persistence layer
 */
export class YjsDocumentManager {
  private readonly _ydoc: Y.Doc;
  private readonly _provider: IndexeddbPersistence;
  private readonly _workspacesMap: Y.Map<any>;
  private readonly _objectsMap: Y.Map<any>;
  private readonly _reviver: KritzelReviver;
  private _isReady: boolean = false;

  constructor(core: KritzelCore, docName: string = 'kritzel-document') {
    this._reviver = new KritzelReviver(core);
    
    // Initialize Yjs document
    this._ydoc = new Y.Doc();
    
    // Get or create shared YMaps
    this._workspacesMap = this._ydoc.getMap('workspaces');
    this._objectsMap = this._ydoc.getMap('objects');
    
    // Initialize IndexedDB persistence
    this._provider = new IndexeddbPersistence(docName, this._ydoc);
  }

  /**
   * Initialize the Yjs document and wait for persistence to be ready
   */
  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      this._provider.on('synced', () => {
        this._isReady = true;
        resolve();
      });
    });
  }

  /**
   * Check if the document is ready
   */
  get isReady(): boolean {
    return this._isReady;
  }

  // ==================== Workspace Methods ====================

  /**
   * Add or update a workspace
   */
  setWorkspace(workspace: KritzelSerializable): void {
    const serialized = workspace.serialize();
    this._workspacesMap.set(serialized.id, serialized);
  }

  /**
   * Get a workspace by ID
   */
  getWorkspace<T extends KritzelSerializable>(id: string): T | null {
    const serialized = this._workspacesMap.get(id);
    if (!serialized) return null;
    return this._reviver.revive<T>(serialized);
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces<T extends KritzelSerializable>(): T[] {
    const workspaces: T[] = [];
    this._workspacesMap.forEach((value) => {
      workspaces.push(this._reviver.revive<T>(value));
    });
    return workspaces;
  }

  /**
   * Delete a workspace
   */
  deleteWorkspace(id: string): void {
    this._workspacesMap.delete(id);
  }

  /**
   * Observe workspace changes
   */
  observeWorkspaces(callback: (event: Y.YMapEvent<any>) => void): void {
    this._workspacesMap.observe(callback);
  }

  /**
   * Unobserve workspace changes
   */
  unobserveWorkspaces(callback: (event: Y.YMapEvent<any>) => void): void {
    this._workspacesMap.unobserve(callback);
  }

  // ==================== Object Methods ====================

  /**
   * Add or update an object
   */
  setObject(object: KritzelSerializable): void {
    const serialized = object.serialize();
    // Create a composite key: workspaceId:objectId
    const key = `${serialized.workspaceId}:${serialized.id}`;
    this._objectsMap.set(key, serialized);
  }

  /**
   * Get an object by workspace ID and object ID
   */
  getObject<T extends KritzelSerializable>(workspaceId: string, objectId: string): T | null {
    const key = `${workspaceId}:${objectId}`;
    const serialized = this._objectsMap.get(key);
    if (!serialized) return null;
    return this._reviver.revive<T>(serialized);
  }

  /**
   * Get all objects for a specific workspace
   */
  getObjectsByWorkspace<T extends KritzelSerializable>(workspaceId: string): T[] {
    const objects: T[] = [];
    const prefix = `${workspaceId}:`;
    
    this._objectsMap.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        objects.push(this._reviver.revive<T>(value));
      }
    });
    
    return objects;
  }

  /**
   * Get all objects across all workspaces
   */
  getAllObjects<T extends KritzelSerializable>(): T[] {
    const objects: T[] = [];
    this._objectsMap.forEach((value) => {
      objects.push(this._reviver.revive<T>(value));
    });
    return objects;
  }

  /**
   * Delete an object
   */
  deleteObject(workspaceId: string, objectId: string): void {
    const key = `${workspaceId}:${objectId}`;
    this._objectsMap.delete(key);
  }

  /**
   * Delete all objects for a specific workspace
   */
  deleteObjectsByWorkspace(workspaceId: string): void {
    const prefix = `${workspaceId}:`;
    const keysToDelete: string[] = [];
    
    this._objectsMap.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this._objectsMap.delete(key));
  }

  /**
   * Observe object changes
   */
  observeObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.observe(callback);
  }

  /**
   * Unobserve object changes
   */
  unobserveObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.unobserve(callback);
  }

  // ==================== Transaction Methods ====================

  /**
   * Execute multiple operations in a single transaction
   */
  transaction(callback: () => void): void {
    this._ydoc.transact(callback);
  }

  // ==================== Cleanup ====================

  /**
   * Destroy the document and clean up resources
   */
  destroy(): void {
    this._provider.destroy();
    this._ydoc.destroy();
  }
}
