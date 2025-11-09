import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelReviver } from './reviver.class';
import { KritzelCore } from './core.class';
import { BroadcastChannelProvider } from './broadcast-channel-provider.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelWorkspace } from './workspace.class';

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
      trackedOrigins: new Set(['local']), // Only track local changes for undo/redo
      ignoreRemoteMapChanges: true,
    });

    this._undoManager.on('stack-item-added', (event) => {
      if(event.type === 'undo') {
        console.log('Undo performed, rerendering core', this._undoManager.undoStack.length, this._undoManager.redoStack.length);
      }
    });

    this._undoManager.on('stack-item-popped', (event) => {
      if(event.type === 'undo') {
        console.log('Redo performed, rerendering core', this._undoManager.undoStack.length, this._undoManager.redoStack.length);
      }
    });

    // Observe changes to _objectsMap and sync with application state
    this._objectsMap.observe(event => {
      this.handleObjectsChange(event);
    });

    // Observe changes to _workspacesMap and sync with application state
    this._workspacesMap.observe(event => {
      this.handleWorkspacesChange(event);
    });
  }

  private handleWorkspacesChange(event: Y.YMapEvent<any>): void {
    // Skip local changes (already updated in the store)
    if (event.transaction.origin === 'local') {
      return;
    }

    // Update the workspaces list in the store
    this._core.store.state.workspaces = this.getAllWorkspaces<KritzelWorkspace>();
    
    // Notify the engine to emit workspacesChange event
    if (this._core.engine) {
      this._core.engine.workspacesChange.emit(this._core.store.state.workspaces);
    }
  }

  private handleObjectsChange(event: Y.YMapEvent<any>): void {
    // Only process changes if we have an active workspace
    if (!this._core.store.state.activeWorkspace) {
      return;
    }

    // Skip Map updates for local changes (already done), but still trigger re-render
    if (event.transaction.origin === 'local') {
      this._core.rerender();
      return;
    }

    const activeWorkspaceId = this._core.store.state.activeWorkspace.id;
    const changedKeys = Array.from(event.keysChanged);
    const objectsToUpdate = [];
    const selectionGroupsToUpdate = [];
    const objectsToDelete = [];

    changedKeys.forEach(key => {
      // Only process objects belonging to the active workspace
      const [workspaceId, objectId] = key.split(':');
      if (workspaceId !== activeWorkspaceId) {
        return; // Skip objects from other workspaces
      }

      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        // Handle deletion
        if (objectId) {
          objectsToDelete.push(objectId);
        }
      } else {
        // Handle add or update
        const serialized = this._objectsMap.get(key);
        if (serialized) {
          const object = this._reviver.revive(serialized);

          // Separate SelectionGroups to process them after regular objects
          // This ensures child objects are in the objectsMap before the SelectionGroup tries to access them
          if(object instanceof KritzelSelectionGroup){
            selectionGroupsToUpdate.push(object);
          } else {
            objectsToUpdate.push(object);
          }
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

      // First, update or insert regular objects (child objects)
      objectsToUpdate.forEach(object => {
        // Try to update first, if it fails (object doesn't exist), insert it
        if (!objectsMap.update(object)) {
          objectsMap.insert(object);
        }
      });

      // Then, update or insert SelectionGroups (which reference the child objects)
      selectionGroupsToUpdate.forEach(object => {
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
    
    // Tag as local transaction to avoid redundant processing in handleWorkspacesChange
    this._ydoc.transact(() => {
      this._workspacesMap.set(serialized.id, serialized);
    }, 'local');
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
    // Tag as local transaction to avoid redundant processing in handleWorkspacesChange
    this._ydoc.transact(() => {
      this._workspacesMap.delete(id);
    }, 'local');
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

    // Tag as local transaction to avoid redundant processing in handleObjectsChange
    this._ydoc.transact(() => {
      this._objectsMap.set(key, serialized);
    }, 'local');
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
    
    // Tag as local transaction to avoid redundant processing in handleObjectsChange
    this._ydoc.transact(() => {
      this._objectsMap.delete(key);
    }, 'local');
  }

  deleteObjectsByWorkspace(workspaceId: string): void {
    const prefix = `${workspaceId}:`;
    const keysToDelete: string[] = [];

    this._objectsMap.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    // Tag as local transaction to avoid redundant processing in handleObjectsChange
    this._ydoc.transact(() => {
      keysToDelete.forEach(key => this._objectsMap.delete(key));
    }, 'local');
  }

  observeObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.observe(callback);
  }

  unobserveObjects(callback: (event: Y.YMapEvent<any>) => void): void {
    this._objectsMap.unobserve(callback);
  }

  transaction(callback: () => void): void {
    // Tag as local transaction for undo/redo tracking and to skip handleObjectsChange
    this._ydoc.transact(callback, 'local');
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
