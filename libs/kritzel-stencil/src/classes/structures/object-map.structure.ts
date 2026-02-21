import * as Y from 'yjs';
import { KritzelReviver } from '../core/reviver.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import type { KritzelCore } from '../core/core.class';
import { ISyncProvider } from '../../interfaces/sync-provider.interface';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { DEFAULT_SYNC_CONFIG } from '../../configs/default-sync.config';
import { KritzelUndoState } from '../../interfaces/undo-state.interface';
import { KritzelQuadtree } from './quadtree.structure';

export class KritzelObjectMap<T extends KritzelBaseObject<any>> {
  private quadtree: KritzelQuadtree<T>;
  private _ydoc: Y.Doc | null = null;
  private _objectsMap: Y.Map<any> | null = null;
  private _providers: ISyncProvider[] = [];
  private _undoManager: Y.UndoManager | null = null;
  private _reviver: KritzelReviver | null = null;
  private _core: KritzelCore | null = null;
  private _workspaceId: string | null = null;
  private _isReady: boolean = false;
  private _temporaryItemsCount: number = 0;

  // Store observer/listener references for cleanup
  private _objectsObserver: ((event: Y.YMapEvent<any>) => void) | null = null;
  private _stackItemAddedHandler: ((event: any) => void) | null = null;
  private _stackItemPoppedHandler: ((event: any) => void) | null = null;

  get isReady(): boolean {
    return this._isReady;
  }

  get undoManager(): Y.UndoManager | null {
    return this._undoManager;
  }

  get workspaceId(): string | null {
    return this._workspaceId;
  }

  get undoState(): KritzelUndoState {
    return {
      canUndo: this._undoManager ? this._undoManager.canUndo() : false,
      canRedo: this._undoManager ? this._undoManager.canRedo() : false,
      undoStackSize: this._undoManager ? this._undoManager.undoStack.length : 0,
      redoStackSize: this._undoManager ? this._undoManager.redoStack.length : 0,
    };
  }

  get totalCount(): number {
    return this.quadtree.size;
  }

  constructor() {
    this.quadtree = new KritzelQuadtree<T>(
      {
        x: -Infinity,
        y: -Infinity,
        z: 0,
        width: Infinity,
        height: Infinity,
      },
      8
    );
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

    // Store handler references for cleanup
    this._stackItemAddedHandler = event => {
      if (event.type === 'undo') {
        // Track if this was a temporary item
        if (event.origin === 'temporary') {
          this._temporaryItemsCount++;
        }
      }
    };

    this._stackItemPoppedHandler = event => {
      if (event.type === 'undo') {
        // Reduce temporary count when items are undone
        if (event.origin === 'temporary' && this._temporaryItemsCount > 0) {
          this._temporaryItemsCount--;
        }
      }
    };

    this._undoManager.on('stack-item-added', this._stackItemAddedHandler);
    this._undoManager.on('stack-item-popped', this._stackItemPoppedHandler);

    // Observe changes to objects and sync with application state
    this._objectsObserver = event => {
      this.handleObjectsChange(event);
    };
    this._objectsMap.observe(this._objectsObserver);

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
    const selectionGroupsToUpdate: KritzelSelectionGroup[] = [];
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
      this.quadtree.remove(o => o.id === objectId);
    });

    // First, update or insert regular objects
    objectsToUpdate.forEach(object => {
      const existed = this.quadtree.filter(o => o.id === object.id).length > 0;
      if (existed) {
        this.quadtree.update(object);
      } else {
        this.quadtree.insert(object);
      }
    });

    // Then, update or insert SelectionGroups
    const updatedSelectionGroupIds = new Set<string>();
    selectionGroupsToUpdate.forEach(object => {
      const existed = this.quadtree.filter(o => o.id === object.id).length > 0;
      if (existed) {
        this.quadtree.update(object as unknown as T);
      } else {
        this.quadtree.insert(object as unknown as T);
      }
      updatedSelectionGroupIds.add(object.id);

      // After undo/redo, the SelectionGroup's dimensions may be stale because:
      // 1. The serialized state contains the old bounding box
      // 2. The child objects have been reverted to their previous positions
      // We need to invalidate the cache and recalculate dimensions
      // skipPersist=true prevents creating new undo entries
      object.invalidateObjectsCache();
      object.refreshObjectDimensions(undefined, true);
      object.captureUnchangedSnapshots();
      // Update quadtree again with corrected dimensions
      this.quadtree.update(object as unknown as T);
    });

    // If regular objects were changed but their SelectionGroup wasn't explicitly updated,
    // we still need to refresh that SelectionGroup's dimensions
    if (objectsToUpdate.length > 0 || objectsToDelete.length > 0) {
      const changedObjectIds = new Set([
        ...objectsToUpdate.map(o => o.id),
        ...objectsToDelete
      ]);

      // Find any existing SelectionGroups that contain changed objects
      const existingSelectionGroups = this.quadtree.filter(
        o => o instanceof KritzelSelectionGroup && !updatedSelectionGroupIds.has(o.id)
      ) as unknown as KritzelSelectionGroup[];

      for (const selectionGroup of existingSelectionGroups) {
        const hasChangedChildren = selectionGroup.objectIds.some(id => changedObjectIds.has(id));
        if (hasChangedChildren) {
          selectionGroup.invalidateObjectsCache();
          selectionGroup.refreshObjectDimensions(undefined, true);
          selectionGroup.captureUnchangedSnapshots();
          // Update quadtree with corrected dimensions
          this.quadtree.update(selectionGroup as unknown as T);
        }
      }
    }

    // Invalidate the store's selection cache so it fetches the updated SelectionGroup
    this._core?.store.invalidateSelectionCache();

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

    this.quadtree.reset();
    this._objectsMap.forEach(serialized => {
      const object = this._reviver.revive<T>(serialized);
      this.quadtree.insert(object);
    });
  }

  reset(): void {
    this.quadtree.reset();
    this._ydoc.transact(() => {
      this._objectsMap.clear();
    }, 'local');
  }

  insert(object: T): boolean {
    if (!object.id) {
      return false;
    }
    this.quadtree.insert(object);

    if (this._objectsMap && this.isPersistable(object)) {
      const serialized = object.serialize();
      this._ydoc.transact(() => {
        this._objectsMap.set(object.id, serialized);
      }, 'local');
    }

    return true;
  }

  update(object: T, options: { temporary?: boolean } = {}): boolean {
    if (!object.id) {
      return false;
    }
    const existed = this.quadtree.filter(o => o.id === object.id).length > 0;
    if (!existed) {
      return false;
    }
    this.quadtree.update(object);

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
    const objectsToRemove = this.quadtree.filter(predicate);
    for (const object of objectsToRemove) {
      this.quadtree.remove(o => o.id === object.id);

      if (this._objectsMap && this.isPersistable(object)) {
        this._ydoc.transact(() => {
          this._objectsMap.delete(object.id);
        }, 'local');
      }
    }
  }

  filter(predicate: (object: T) => boolean): T[] {
    return this.quadtree.filter(predicate);
  }

  allObjects(): T[] {
    return this.quadtree.allObjects();
  }

  query(range: { x: number; y: number; z: number; width: number; height: number; depth?: number }): T[] {
    return this.quadtree.query(range);
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
    // Unobserve the objects map
    if (this._objectsMap && this._objectsObserver) {
      this._objectsMap.unobserve(this._objectsObserver);
      this._objectsObserver = null;
    }

    // Remove undo manager event listeners
    if (this._undoManager) {
      if (this._stackItemAddedHandler) {
        this._undoManager.off('stack-item-added', this._stackItemAddedHandler);
        this._stackItemAddedHandler = null;
      }
      if (this._stackItemPoppedHandler) {
        this._undoManager.off('stack-item-popped', this._stackItemPoppedHandler);
        this._stackItemPoppedHandler = null;
      }
      this._undoManager.destroy();
      this._undoManager = null;
    }

    // Reset quadtree
    this.quadtree.reset();

    // Destroy providers
    this._providers.forEach(p => p.destroy());
    this._providers = [];

    // Clear object map reference
    this._objectsMap = null;

    // Destroy Y.Doc
    if (this._ydoc) {
      this._ydoc.destroy();
      this._ydoc = null;
    }

    // Clear remaining references
    this._core = null;
    this._reviver = null;
    this._workspaceId = null;
    this._isReady = false;
    this._temporaryItemsCount = 0;
  }
}
