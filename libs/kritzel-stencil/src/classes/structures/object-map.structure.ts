import * as Y from 'yjs';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelCore } from '../core/core.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { DEFAULT_SYNC_CONFIG } from '../../configs/default-sync.config';

export class KritzelObjectMap<T extends KritzelBaseObject<any>> {
  private map: Map<string, T>;
  private _ydoc: Y.Doc | null = null;
  private _objectsMap: Y.Map<any> | null = null;
  private _providers: ISyncProvider[] = [];
  private _undoManager: Y.UndoManager | null = null;
  private _reviver: KritzelReviver | null = null;
  private _core: KritzelCore | null = null;
  private _workspaceId: string | null = null;
  private _syncEnabled: boolean = true;
  private _isReady: boolean = false;

  get isReady(): boolean {
    return this._isReady;
  }

  get undoManager(): Y.UndoManager | null {
    return this._undoManager;
  }

  get workspaceId(): string | null {
    return this._workspaceId;
  }

  constructor() {
    this.map = new Map<string, T>();
  }

  async initialize(core: KritzelCore, workspaceId: string, config?: KritzelSyncConfig): Promise<void> {
    this._core = core;
    this._workspaceId = workspaceId;
    this._reviver = new KritzelReviver(core);

    // Create a dedicated Y.Doc for this workspace
    this._ydoc = new Y.Doc();
    this._objectsMap = this._ydoc.getMap('objects');

    const docName = `kritzel-workspace-${workspaceId}`;
    const finalConfig = config ?? DEFAULT_SYNC_CONFIG;

    // Instantiate providers from configuration
    for (const providerConfig of finalConfig.providers) {
      let provider: ISyncProvider;

      debugger;

      // Check if it's a class constructor or a factory
      if (typeof providerConfig === 'function') {
        // It's a class constructor
        provider = new providerConfig(docName, this._ydoc);
      } else {
        // It's a factory with a create method
        provider = providerConfig.create(docName, this._ydoc);
      }

      this._providers.push(provider);
    }

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

    // Connect all providers in parallel
    await Promise.all(this._providers.map(p => p.connect()));
    this._isReady = true;

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

    // Delete objects from local map
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
  }
  transaction(callback: () => void): void {
    if (this._ydoc) {
      this._ydoc.transact(callback, 'local');
    }
  }

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

  undo(): void {
    if (this._undoManager && this._undoManager.canUndo()) {
      this._undoManager.undo();
    }
  }

  redo(): void {
    if (this._undoManager && this._undoManager.canRedo()) {
      this._undoManager.redo();
    }
  }

  canUndo(): boolean {
    return this._undoManager ? this._undoManager.canUndo() : false;
  }

  canRedo(): boolean {
    return this._undoManager ? this._undoManager.canRedo() : false;
  }

  clearHistory(): void {
    if (this._undoManager) {
      this._undoManager.clear();
    }
  }

  destroy(): void {
    // Destroy all providers
    this._providers.forEach(p => p.destroy());
    this._providers = [];

    if (this._ydoc) {
      this._ydoc.destroy();
    }
    this.map.clear();
  }
}
