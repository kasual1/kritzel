import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelReviver } from './reviver.class';
import { KritzelCore } from './core.class';

export class YjsDocumentManager {
  private readonly _ydoc: Y.Doc;
  private readonly _provider: IndexeddbPersistence;
  private readonly _workspacesMap: Y.Map<any>;
  private readonly _objectsMap: Y.Map<any>;
  private readonly _reviver: KritzelReviver;
  private readonly _undoManager: Y.UndoManager;
  private _isReady: boolean = false;

  constructor(core: KritzelCore, docName: string = 'kritzel-document') {
    this._reviver = new KritzelReviver(core);
    
    this._ydoc = new Y.Doc();
    
    this._workspacesMap = this._ydoc.getMap('workspaces');
    this._objectsMap = this._ydoc.getMap('objects');
    
    this._provider = new IndexeddbPersistence(docName, this._ydoc);
    
    this._undoManager = new Y.UndoManager([this._workspacesMap, this._objectsMap], {
      captureTimeout: 0,
      trackedOrigins: new Set([null]), // Only track changes without an origin or with null origin
    });
  }

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      this._provider.on('synced', () => {
        this._isReady = true;
        resolve();
      });
    });
  }

  get isReady(): boolean {
    return this._isReady;
  }

  setWorkspace(workspace: KritzelSerializable): void {
    const serialized = workspace.serialize();
    this._workspacesMap.set(serialized.id, serialized);
  }

  getWorkspace<T extends KritzelSerializable>(id: string): T | null {
    const serialized = this._workspacesMap.get(id);
    if (!serialized) return null;
    return this._reviver.revive<T>(serialized);
  }

  getAllWorkspaces<T extends KritzelSerializable>(): T[] {
    const workspaces: T[] = [];
    this._workspacesMap.forEach((value) => {
      workspaces.push(this._reviver.revive<T>(value));
    });
    return workspaces;
  }

  deleteWorkspace(id: string): void {
    this._workspacesMap.delete(id);
  }

  observeWorkspaces(callback: (event: Y.YMapEvent<any>) => void): void {
    this._workspacesMap.observe(callback);
  }

  unobserveWorkspaces(callback: (event: Y.YMapEvent<any>) => void): void {
    this._workspacesMap.unobserve(callback);
  }

  setObject(object: KritzelSerializable): void {
    const serialized = object.serialize();
    // Create a composite key: workspaceId:objectId
    const key = `${serialized.workspaceId}:${serialized.id}`;
    this._objectsMap.set(key, serialized);
  }

  setObjectUntracked(object: KritzelSerializable): void {
    const serialized = object.serialize();
    // Create a composite key: workspaceId:objectId
    const key = `${serialized.workspaceId}:${serialized.id}`;
    // Use 'skip-undo' as the origin to exclude from undo tracking
    this._ydoc.transact(() => {
      this._objectsMap.set(key, serialized);
    }, 'skip-undo');
  }

  getObject<T extends KritzelSerializable>(workspaceId: string, objectId: string): T | null {
    const key = `${workspaceId}:${objectId}`;
    const serialized = this._objectsMap.get(key);
    if (!serialized) return null;
    return this._reviver.revive<T>(serialized);
  }

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

  getAllObjects<T extends KritzelSerializable>(): T[] {
    const objects: T[] = [];
    this._objectsMap.forEach((value) => {
      objects.push(this._reviver.revive<T>(value));
    });
    return objects;
  }

  deleteObject(workspaceId: string, objectId: string): void {
    const key = `${workspaceId}:${objectId}`;
    this._objectsMap.delete(key);
  }

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

  observeObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.observe(callback);
  }

  unobserveObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.unobserve(callback);
  }


  /**
   * Execute multiple operations in a single transaction
   */
  transaction(callback: () => void): void {
    this._ydoc.transact(callback);
  }


  undo(): void {
    this._undoManager.undo();
  }

  redo(): void {
    this._undoManager.redo();
  }

  clearHistory(): void {
    this._undoManager.clear();
  }

  stopCapturing(): void {
    this._undoManager.stopCapturing();
  }

  destroy(): void {
    this._undoManager.destroy();
    this._provider.destroy();
    this._ydoc.destroy();
  }
}
