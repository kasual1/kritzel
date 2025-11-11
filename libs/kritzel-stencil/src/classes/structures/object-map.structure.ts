import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BroadcastChannelProvider } from '../core/broadcast-channel-provider.class';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelCore } from '../core/core.class';

export class KritzelObjectMap<T extends KritzelBaseObject<any>> {
  private map: Map<string, T>;
  private _ydoc: Y.Doc | null = null;
  private _objectsMap: Y.Map<any> | null = null;
  private _persistenceProvider: IndexeddbPersistence | null = null;
  private _broadcastProvider: BroadcastChannelProvider | null = null;
  private _undoManager: Y.UndoManager | null = null;
  private _reviver: KritzelReviver | null = null;
  private _core: KritzelCore | null = null;
  private _workspaceId: string | null = null;
  private _syncEnabled: boolean = true;
  private _isReady: boolean = false;

  constructor() {
    this.map = new Map<string, T>();
  }

  /**
   * Initialize this ObjectMap with its own Y.Doc for a specific workspace
   */
  async initialize(core: KritzelCore, workspaceId: string): Promise<void> {
    this._core = core;
    this._workspaceId = workspaceId;
    this._reviver = new KritzelReviver(core);

    // Create a dedicated Y.Doc for this workspace
    this._ydoc = new Y.Doc();
    this._objectsMap = this._ydoc.getMap('objects');

    const docName = `kritzel-workspace-${workspaceId}`;
    
    this._persistenceProvider = new IndexeddbPersistence(docName, this._ydoc);
    console.info(`IndexedDB Persistence initialized for workspace ${workspaceId}`);

    this._broadcastProvider = new BroadcastChannelProvider(docName, this._ydoc);
    console.info(`BroadcastChannel Provider initialized for workspace ${workspaceId}`);

    // Set up undo/redo manager for this workspace
    this._undoManager = new Y.UndoManager([this._objectsMap], {
      captureTimeout: 200,
      trackedOrigins: new Set(['local']),
      ignoreRemoteMapChanges: true,
    });

    this._undoManager.on('stack-item-added', (event) => {
      if (event.type === 'undo') {
        console.log('Undo performed for workspace', workspaceId, this._undoManager.undoStack.length, this._undoManager.redoStack.length);
      }
    });

    this._undoManager.on('stack-item-popped', (event) => {
      if (event.type === 'undo') {
        console.log('Redo performed for workspace', workspaceId, this._undoManager.undoStack.length, this._undoManager.redoStack.length);
      }
    });

    // Observe changes to objects and sync with application state
    this._objectsMap.observe(event => {
      this.handleObjectsChange(event);
    });

    // Wait for persistence to be ready
    await new Promise<void>(resolve => {
      this._persistenceProvider.on('synced', () => {
        this._isReady = true;
        resolve();
      });
    });

    // Load objects from Yjs
    this.loadFromYjs();
  }

  private handleObjectsChange(event: Y.YMapEvent<any>): void {
    // Skip Map updates for local changes (already done), but still trigger re-render
    if (event.transaction.origin === 'local') {
      this._core?.rerender();
      return;
    }

    const changedKeys = Array.from(event.keysChanged);
    const objectsToUpdate = [];
    const selectionGroupsToUpdate = [];
    const objectsToDelete = [];

    changedKeys.forEach(key => {
      const change = event.changes.keys.get(key);

      if (change && change.action === 'delete') {
        objectsToDelete.push(key);
      } else {
        const serialized = this._objectsMap.get(key);
        if (serialized) {
          const object = this._reviver.revive(serialized);

          // Separate SelectionGroups to process them after regular objects
          if (object instanceof KritzelSelectionGroup) {
            selectionGroupsToUpdate.push(object);
          } else {
            objectsToUpdate.push(object);
          }
        }
      }
    });

    // Temporarily disable sync to prevent feedback loop
    const wasSyncEnabled = this._syncEnabled;
    this._syncEnabled = false;

    try {
      // Delete objects
      objectsToDelete.forEach(objectId => {
        this.map.delete(objectId);
      });

      // First, update or insert regular objects
      objectsToUpdate.forEach(object => {
        this.map.set(object.id, object);
      });

      // Then, update or insert SelectionGroups
      selectionGroupsToUpdate.forEach(object => {
        this.map.set(object.id, object);
      });

      this._core?.rerender();
    } finally {
      // Re-enable sync
      this._syncEnabled = wasSyncEnabled;
    }
  }

  /**
   * Enable or disable automatic syncing to Yjs
   */
  setSyncEnabled(enabled: boolean): void {
    this._syncEnabled = enabled;
  }

  /**
   * Executes a set of operations as a single transaction for undo/redo purposes.
   * @param callback The function containing operations to be batched.
   */
  transaction(callback: () => void): void {
    if (this._ydoc) {
      this._ydoc.transact(callback, 'local');
    }
  }

  /**
   * Load objects from Yjs
   */
  loadFromYjs(): void {
    if (!this._objectsMap || !this._reviver) {
      return;
    }

    this.map.clear();
    this._objectsMap.forEach((serialized, key) => {
      const object = this._reviver.revive<T>(serialized);
      this.map.set(key, object);
    });
  }

  get isReady(): boolean {
    return this._isReady;
  }

  get undoManager(): Y.UndoManager | null {
    return this._undoManager;
  }

  get workspaceId(): string | null {
    return this._workspaceId;
  }

  reset(): void {
    this.map.clear();

    // Clear all objects from Yjs
    if (this._objectsMap && this._syncEnabled) {
      this._ydoc.transact(() => {
        this._objectsMap.clear();
      }, 'local');
    }
  }

  insert(object: T): boolean {
    if (!object.id) {
      return false;
    }
    this.map.set(object.id, object);

    // Sync to Yjs if enabled and object should be persisted
    if (this._objectsMap && this._syncEnabled && this.shouldPersist(object)) {
      const serialized = object.serialize();
      this._ydoc.transact(() => {
        this._objectsMap.set(object.id, serialized);
      }, 'local');
    }

    return true;
  }

  update(object: T): boolean {
    if (!object.id || !this.map.has(object.id)) {
      return false;
    }
    this.map.set(object.id, object);

    // Sync to Yjs if enabled and object should be persisted
    if (this._objectsMap && this._syncEnabled && this.shouldPersist(object)) {
      const serialized = object.serialize();
      this._ydoc.transact(() => {
        this._objectsMap.set(object.id, serialized);
      }, 'local');
    }

    return true;
  }

  remove(predicate: (object: T) => boolean): void {
    for (const [id, object] of this.map) {
      if (predicate(object)) {
        this.map.delete(id);

        // Sync deletion to Yjs if enabled and object should be persisted
        if (this._objectsMap && this._syncEnabled && this.shouldPersist(object)) {
          this._ydoc.transact(() => {
            this._objectsMap.delete(id);
          }, 'local');
        }
      }
    }
  }

  filter(predicate: (object: T) => boolean): T[] {
    const results: T[] = [];
    for (const object of this.map.values()) {
      if (predicate(object)) {
        results.push(object);
      }
    }
    return results;
  }

  allObjects(): T[] {
    return Array.from(this.map.values());
  }

  private shouldPersist(object: T): boolean {
    // Don't persist transient UI objects
    if (object instanceof KritzelSelectionBox) {
      return false;
    }

    return true;
  }

  /**
   * Undo the last operation
   */
  undo(): void {
    if (this._undoManager && this._undoManager.canUndo()) {
      this._undoManager.undo();
    }
  }

  /**
   * Redo the last undone operation
   */
  redo(): void {
    if (this._undoManager && this._undoManager.canRedo()) {
      this._undoManager.redo();
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this._undoManager ? this._undoManager.canUndo() : false;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this._undoManager ? this._undoManager.canRedo() : false;
  }

  /**
   * Clear undo/redo history
   */
  clearHistory(): void {
    if (this._undoManager) {
      this._undoManager.clear();
    }
  }

  /**
   * Cleanup resources when disposing this ObjectMap
   */
  destroy(): void {
    if (this._persistenceProvider) {
      this._persistenceProvider.destroy();
    }
    if (this._broadcastProvider) {
      this._broadcastProvider.destroy();
    }
    if (this._ydoc) {
      this._ydoc.destroy();
    }
    this.map.clear();
  }
}
