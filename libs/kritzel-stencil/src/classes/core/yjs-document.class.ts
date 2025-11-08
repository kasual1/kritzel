import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelReviver } from './reviver.class';
import { KritzelCore } from './core.class';
import { BroadcastChannelProvider } from './broadcast-channel-provider.class';

export class YjsDocumentManager {
  private readonly _ydoc: Y.Doc;
  private readonly _provider: IndexeddbPersistence;
  private readonly _broadcastProvider: BroadcastChannelProvider;
  private readonly _workspacesMap: Y.Map<any>;
  private readonly _objectsMap: Y.Map<any>;
  private readonly _reviver: KritzelReviver;
  private readonly _undoManager: Y.UndoManager;
  private _isReady: boolean = false;
  private _core: KritzelCore;

  constructor(core: KritzelCore, docName: string) {
    this._core = core;
    this._reviver = new KritzelReviver(core);

    this._ydoc = new Y.Doc();

    this._workspacesMap = this._ydoc.getMap('workspaces');
    this._objectsMap = this._ydoc.getMap('objects');

    this._provider = new IndexeddbPersistence(docName, this._ydoc);

    // Initialize BroadcastChannel provider for cross-tab synchronization
    this._broadcastProvider = new BroadcastChannelProvider(docName, this._ydoc);

    this._undoManager = new Y.UndoManager([this._objectsMap], {
      captureTimeout: 200,
      trackedOrigins: new Set([null]),
      ignoreRemoteMapChanges: true,
    });

    this._undoManager.on('stack-item-added', event => {
      if (event.type === 'undo') {
        console.log('stack-item-added', this._undoManager.undoStack.length, event.type);
      }
    });

    this._undoManager.on('stack-item-popped', event => {
      if (event.type === 'undo') {
        console.log('stack-item-popped', this._undoManager.undoStack.length, event.type);
      }
    });

    // Observe changes to _objectsMap and sync with application state
    this._objectsMap.observe(event => {
      this.handleObjectsChange(event);
    });
  }

  private handleObjectsChange(event: Y.YMapEvent<any>): void {
    // Only process changes if we have an active workspace
    if (!this._core.store.state.activeWorkspace) {
      return;
    }

    const changedKeys = Array.from(event.keysChanged);
    const objectsToUpdate = [];
    const objectsToDelete = [];

    changedKeys.forEach(key => {
      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        // Handle deletion
        const objectId = key.split(':')[1];
        if (objectId) {
          objectsToDelete.push(objectId);
        }
      } else {
        // Handle add or update
        const serialized = this._objectsMap.get(key);
        if (serialized) {
          const object = this._reviver.revive(serialized);
          objectsToUpdate.push(object);
        }
      }
    });

    // Temporarily disable sync to prevent feedback loop
    const objectsMap = this._core.store.state.objectsMap;
    const wasSyncEnabled = objectsMap['syncEnabled'];
    objectsMap.setSyncEnabled(false);

    try {
      // Delete objects
      objectsToDelete.forEach(objectId => {
        objectsMap.remove(obj => obj.id === objectId);
      });

      // Update or insert objects
      objectsToUpdate.forEach(object => {
        // Try to update first, if it fails (object doesn't exist), insert it
        if (!objectsMap.update(object)) {
          objectsMap.insert(object);
        }
      });

      this._core.rerender();
    } finally {
      // Re-enable sync
      objectsMap.setSyncEnabled(wasSyncEnabled);
    }
  }

  async initialize(): Promise<void> {
    return new Promise(resolve => {
      this._provider.on('synced', () => {
        resolve();
        this._isReady = true;
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
    this._workspacesMap.forEach(value => {
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
    const key = `${serialized.workspaceId}:${serialized.id}`;

    this._objectsMap.set(key, serialized);
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

    this._objectsMap.forEach(value => {
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
    this._broadcastProvider.destroy();
    this._provider.destroy();
    this._ydoc.destroy();
  }
}
