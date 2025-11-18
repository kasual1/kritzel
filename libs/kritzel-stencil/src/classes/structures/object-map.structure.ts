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
  private _isReady: boolean = false;
  private _temporaryItemsCount: number = 0;

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
      trackedOrigins: new Set(['local', 'temporary']),
      ignoreRemoteMapChanges: true,
    });

    this._undoManager.on('stack-item-added', event => {
      if (event.type === 'undo') {
        // Track if this was a temporary item
        if (event.origin === 'temporary') {
          this._temporaryItemsCount++;
        }
      }
    });

    this._undoManager.on('stack-item-popped', event => {
      if (event.type === 'undo') {
        // Reduce temporary count when items are undone
        if (event.origin === 'temporary' && this._temporaryItemsCount > 0) {
          this._temporaryItemsCount--;
        }
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
    // 'temporary' is also a local change that shouldn't be re-deserialized
    if (event.transaction.origin === 'local' || event.transaction.origin === 'temporary') {
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
    this._ydoc.transact(() => {
      this._objectsMap.clear();
    }, 'local');
  }

  insert(object: T): boolean {
    if (!object.id) {
      return false;
    }
    this.map.set(object.id, object);

    if (this._objectsMap && this.isPersistable(object)) {
      const serialized = object.serialize();
      this._ydoc.transact(() => {
        this._objectsMap.set(object.id, serialized);
      }, 'local');
    }

    return true;
  }

  update(object: T, options: { temporary?: boolean } = {}): boolean {
    if (!object.id || !this.map.has(object.id)) {
      return false;
    }
    this.map.set(object.id, object);

    if (this._objectsMap && this.isPersistable(object)) {
      const serialized = object.serialize();

      const origin = options.temporary ? 'temporary' : 'local';

      this._ydoc.transact(() => {
        this._objectsMap.set(object.id, serialized);
      }, origin);
    }

    return true;
  }

  remove(predicate: (object: T) => boolean): void {
    for (const [id, object] of this.map) {
      if (predicate(object)) {
        this.map.delete(id);

        if (this._objectsMap && this.isPersistable(object)) {
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

  private isPersistable(object: T): boolean {
    if (object instanceof KritzelSelectionBox) {
      return false;
    }

    return true;
  }

  undo(): void {
    if (this._undoManager && this._undoManager.canUndo()) {
      this._undoManager.undo();
      this._core.engine.emitObjectsChange();
    }
  }

  redo(): void {
    if (this._undoManager && this._undoManager.canRedo()) {
      this._undoManager.redo();
      this._core.engine.emitObjectsChange();
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
      this._temporaryItemsCount = 0;
    }
  }

  /**
   * Consolidates all temporary items in the undo stack into a single undo item.
   * Call this when you want to merge multiple temporary changes (e.g., keystrokes) into one.
   */
  consolidateTemporaryItems(): void {
    if (!this._undoManager || this._temporaryItemsCount === 0) {
      return;
    }

    // Get current stack length
    const stackLength = this._undoManager.undoStack.length;
    
    if (stackLength === 0) {
      this._temporaryItemsCount = 0;
      return;
    }

    // Stop tracking temporarily
    this._undoManager.stopCapturing();
    
    // The temporary items should be at the end of the stack
    // We'll need to undo them all, then redo as a single transaction
    const itemsToConsolidate = Math.min(this._temporaryItemsCount, stackLength);
    
    if (itemsToConsolidate > 1) {
      // Store the current state before undoing
      const undoneItems: any[] = [];
      
      // Undo all temporary items
      for (let i = 0; i < itemsToConsolidate; i++) {
        if (this._undoManager.canUndo()) {
          undoneItems.push(this._undoManager.undoStack[this._undoManager.undoStack.length - 1]);
          this._undoManager.undo();
        }
      }
      
      // Now redo them all as a single 'local' transaction
      // This will consolidate them into one undo item
      this._ydoc.transact(() => {
        for (let i = itemsToConsolidate - 1; i >= 0; i--) {
          if (this._undoManager.canRedo()) {
            this._undoManager.redo();
          }
        }
      }, 'local');
    } else if (itemsToConsolidate === 1) {
      // If only one temporary item, just change its origin to 'local'
      // This is implicit - next transaction will be separate
    }
    
    this._temporaryItemsCount = 0;
  }

  /**
   * Removes all temporary items from the undo stack without consolidating them.
   * Use this to discard temporary changes completely.
   */
  clearTemporaryItems(): void {
    if (!this._undoManager || this._temporaryItemsCount === 0) {
      return;
    }

    const stackLength = this._undoManager.undoStack.length;
    const itemsToRemove = Math.min(this._temporaryItemsCount, stackLength);
    
    // Remove items from the end of the stack
    for (let i = 0; i < itemsToRemove; i++) {
      if (this._undoManager.undoStack.length > 0) {
        this._undoManager.undoStack.pop();
      }
    }
    
    this._temporaryItemsCount = 0;
  }

  destroy(): void {
    this._providers.forEach(p => p.destroy());
    this._providers = [];

    if (this._ydoc) {
      this._ydoc.destroy();
    }
    this.map.clear();
  }
}
