import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { KritzelContextMenu } from '../../components/ui/kritzel-context-menu/kritzel-context-menu';
import { DEFAULT_ENGINE_CONFIG } from '../../configs/default-engine-config';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from './store.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { KritzelAppStateMap } from '../structures/app-state-map.structure';
import { KritzelAnchorManager } from '../managers/anchor.manager';
import { KritzelCursorManager } from '../managers/cursor.manager';

export class KritzelCore {
  private readonly _kritzelEngine: KritzelEngine;
  private readonly _store: KritzelStore;
  private _syncConfig?: KritzelSyncConfig;
  private readonly _appStateMap: KritzelAppStateMap;
  private readonly _anchorManager: KritzelAnchorManager;
  private readonly _cursorManager: KritzelCursorManager;

  get engine(): KritzelEngine {
    return this._kritzelEngine;
  }

  get store(): KritzelStore {
    return this._store;
  }

  get appStateMap(): KritzelAppStateMap {
    return this._appStateMap;
  }

  get anchorManager(): KritzelAnchorManager {
    return this._anchorManager;
  }

  get cursorManager(): KritzelCursorManager {
    return this._cursorManager;
  }

  constructor(kritzelEngine: KritzelEngine) {
    this._kritzelEngine = kritzelEngine;
    this._store = new KritzelStore(DEFAULT_ENGINE_CONFIG);
    this._appStateMap = new KritzelAppStateMap();
    this._anchorManager = new KritzelAnchorManager(this);
    this._cursorManager = new KritzelCursorManager(this);
  }

  setSyncConfig(config?: KritzelSyncConfig): void {
    this._syncConfig = config;
  }

  async initializeYjs(): Promise<void> {
    await this._appStateMap.initialize(this, this._syncConfig);
  }

  /**
   * Load all workspaces from app state map
   */
  private loadWorkspacesFromAppState(): KritzelWorkspace[] {
    return this._appStateMap.allWorkspaces();
  }

  /**
   * Save a workspace to app state map
   */
  private saveWorkspaceToAppState(workspace: KritzelWorkspace): void {
    if (this._appStateMap.has(workspace.id)) {
      this._appStateMap.update(workspace);
    } else {
      this._appStateMap.insert(workspace);
    }
  }

  /**
   * Delete a workspace from app state map
   */
  private deleteWorkspaceFromAppState(workspaceId: string): void {
    this._appStateMap.remove(w => w.id === workspaceId);
  }

  async initializeWorkspace(workspace?: KritzelWorkspace): Promise<void> {
    // Load all workspaces from app state map
    const workspaces = this.loadWorkspacesFromAppState();

    // Find most recently updated workspace or use provided/fallback
    const mostRecentWorkspace = workspaces.length > 0 ? [...workspaces].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] : null;

    // Check localStorage for last active workspace
    const lastActiveWorkspaceId = localStorage.getItem('kritzel-active-workspace-id');
    const lastActiveWorkspace = lastActiveWorkspaceId ? workspaces.find(w => w.id === lastActiveWorkspaceId) : null;

    let activeWorkspace: KritzelWorkspace;

    if (workspace) {
      // Use provided workspace
      activeWorkspace = workspace;
      const existing = workspaces.find(w => w.id === workspace.id);
      if (!existing) {
        // New workspace, save it
        activeWorkspace._core = this;
        this.saveWorkspaceToAppState(activeWorkspace);
      }
    } else if (lastActiveWorkspace) {
      // Use last active workspace from localStorage
      activeWorkspace = lastActiveWorkspace;
    } else if (mostRecentWorkspace) {
      // Use most recent workspace
      activeWorkspace = mostRecentWorkspace;
    } else {
      // Create fallback workspace
      activeWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
      activeWorkspace._core = this;
      this.saveWorkspaceToAppState(activeWorkspace);
    }

    // Save active workspace ID to localStorage
    localStorage.setItem('kritzel-active-workspace-id', activeWorkspace.id);

    // Destroy old ObjectMap if switching workspaces
    if (this._store.state.objects && this._store.state.objects.isReady) {
      this._store.state.objects.destroy();
    }

    // Create new ObjectMap with its own Y.Doc for this workspace
    const objectsMap = new KritzelObjectMap();
    // Assign immediately so the UI shows an empty state while loading,
    // instead of showing the old workspace's objects with the new workspace's viewport
    this._store.state.objects = objectsMap;

    // Set active workspace
    this._store.state.activeWorkspace = activeWorkspace;
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    // Set viewport from workspace
    const viewport = activeWorkspace.viewport ?? { translateX: 0, translateY: 0, scale: 1 };
    this._store.state.translateX = viewport.translateX ?? 0;
    this._store.state.translateY = viewport.translateY ?? 0;
    this._store.state.scale = viewport.scale ?? 1;

    await objectsMap.initialize(this, activeWorkspace.id, this._syncConfig);

    // Rebuild anchor index after loading objects
    this._anchorManager.rebuildIndex();

    this.engine.emitObjectsChange();

    this.rerender();
  }

  getObjectsInViewport(): KritzelBaseObject<any>[] {
    const viewportBounds = {
      x: -this._store.state.translateX / this._store.state.scale,
      y: -this._store.state.translateY / this._store.state.scale,
      z: this._store.state.scale,
      width: this._store.state.viewportWidth / this._store.state.scale,
      height: this._store.state.viewportHeight / this._store.state.scale,
      depth: 100,
    };

    return this._store.state.objects
      .query(viewportBounds)
      .filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  rerender() {
    if (this._kritzelEngine) {
      this._kritzelEngine.forceUpdate++;
    }
  }

  findObjectById(id: string): KritzelBaseObject<any> | null {
    for (const object of this._store.allObjects) {
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  getWorkspaces(): KritzelWorkspace[] {
    return this.loadWorkspacesFromAppState();
  }

  createWorkspace(workspace: KritzelWorkspace): void {
    workspace._core = this;
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);
    this._store.state.workspaces = this.loadWorkspacesFromAppState();
  }

  updateWorkspace(workspace: KritzelWorkspace): void {
    workspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(workspace);

    const workspaces = this._store.state.workspaces;
    const index = workspaces.findIndex(w => w.id === workspace.id);

    if (index !== -1) {
      workspaces[index] = workspace;
      this._store.state.workspaces = workspaces;
    }
  }

  deleteWorkspace(workspace: KritzelWorkspace): void {
    // If deleting the active workspace, need to handle ObjectMap cleanup
    if (this._store.state.activeWorkspace?.id === workspace.id) {
      this._store.state.objects?.destroy();
    }

    this.deleteWorkspaceFromAppState(workspace.id);
    this._store.state.workspaces = this.loadWorkspacesFromAppState();

    // Also delete the workspace's IndexedDB database
    const dbName = `kritzel-workspace-${workspace.id}`;
    window.indexedDB.deleteDatabase(dbName);
  }

  updateWorkspaceViewport(translateX: number, translateY: number, scale: number): void {
    const activeWorkspace = this._store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    activeWorkspace.viewport = { translateX, translateY, scale };
    activeWorkspace.updatedAt = new Date();
    this.saveWorkspaceToAppState(activeWorkspace);
  }

  addObject(object: KritzelBaseObject<any>): void {
    this._store.state.objects.insert(object);
  }

  removeObject(object: KritzelBaseObject<any>, preserveChildren: boolean = false): void {
    // Handle KritzelGroup: recursively delete all children first (unless preserveChildren is true)
    if (object instanceof KritzelGroup && !preserveChildren) {
      // Get children before removing the group
      const children = [...object.children];
      children.forEach(child => {
        this.removeObject(child);
      });
    }

    // Handle anchor cleanup
    if (object instanceof KritzelLine) {
      // If removing a line, clean up its anchor index entries
      this._anchorManager.handleLineDeleted(object.id);
    } else {
      // If removing a non-line object, detach any lines anchored to it
      this._anchorManager.handleObjectDeleted(object.id);
    }

    object.isMounted = false;
    this._store.state.objects.remove(o => o.id === object.id);
  }

  updateObject<T extends KritzelBaseObject<any>>(object: T, updatedProperties: Partial<T>): void {
    for (const key in updatedProperties) {
      if (updatedProperties.hasOwnProperty(key)) {
        object[key] = updatedProperties[key];
      }
    }

    this._store.state.objects.update(object);
  }

  addSelectionGroup(selectionGroup: KritzelSelectionGroup): void {
    this.removeSelectionGroup();
    this.removeSelectionBox();
    this._store.state.objects.insert(selectionGroup);
    this._kritzelEngine.triggerSelectionChange();
  }

  removeSelectionGroup(): void {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      this._store.state.objects.remove(object => object.id === selectionGroup.id);
      this._kritzelEngine.triggerSelectionChange();
    }
  }

  removeSelectionBox(): void {
    const selectionBox = this._store.selectionBox;
    if (selectionBox) {
      this._store.state.objects.remove(object => object.id === selectionBox.id);
    }
  }

  deselectAllObjects(): void {
    this.removeSelectionGroup();
    this.rerender();
  }

  delete() {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    selectionGroup.objects.forEach(obj => this.removeObject(obj));

    this.removeSelectionGroup();
    this.rerender();
  }

  undo(): void {
    this._store.state.objects?.undo();
  }

  redo(): void {
    this._store.state.objects?.redo();
  }

  deleteObject(id: string) {
    const object = this.findObjectById(id);
    if (object) {
      this.removeObject(object);
      this.rerender();
    }
  }

  copy() {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      // Copy each object and store them in an array, also track the ID mapping
      const idMapping = new Map<string, string>();
      const copiedObjects = selectionGroup.objects
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(obj => {
          const copiedObj = obj.copy() as KritzelBaseObject<any>;
          // Map: newId -> originalId
          idMapping.set(copiedObj.id, obj.id);
          return copiedObj;
        });

      this._store.state.copiedObjects = copiedObjects;
      this._store.state.copiedObjectIdMapping = idMapping;
    }
  }

  paste(x?: number, y?: number) {
    const copiedObjects = this._store.state.copiedObjects;
    if (!copiedObjects || copiedObjects.length === 0) {
      return;
    }

    const activeWorkspace = this._store.state.activeWorkspace;
    const originalIdMapping = this._store.state.copiedObjectIdMapping;

    // Check if we're pasting from a different workspace
    const isDifferentWorkspace = copiedObjects.some(obj => obj.workspaceId !== activeWorkspace.id);

    // Calculate the bounding box of all copied objects
    const minX = Math.min(...copiedObjects.map(obj => obj.translateX));
    const minY = Math.min(...copiedObjects.map(obj => obj.translateY));

    // Determine the paste position
    let pasteX: number;
    let pasteY: number;

    if (x !== undefined && y !== undefined) {
      // Explicit position provided (e.g., right-click paste)
      pasteX = x;
      pasteY = y;
    } else if (isDifferentWorkspace) {
      // Pasting to different workspace without explicit position
      // Keep original position; will be centered by centerInViewport() later
      pasteX = minX;
      pasteY = minY;
    } else {
      // Same workspace paste: offset by 25 pixels from original position
      pasteX = minX + 25 / this._store.state.scale;
      pasteY = minY + 25 / this._store.state.scale;
    }

    // Calculate the offset to apply to all objects
    const offsetX = pasteX - minX;
    const offsetY = pasteY - minY;

    this.removeSelectionGroup();
    this.removeSelectionBox();

    // Create a new selection group for the pasted objects
    const selectionGroup = KritzelSelectionGroup.create(this);

    // Build a reverse mapping: originalId -> newCopiedObjectId
    // This is used to remap anchor references from original IDs to the copied object IDs
    const originalToNewIdMap = new Map<string, string>();
    if (originalIdMapping) {
      originalIdMapping.forEach((originalId, copiedId) => {
        originalToNewIdMap.set(originalId, copiedId);
      });
    }

    // First add all copied objects to the objectsMap with updated positions
    copiedObjects.forEach((obj, i) => {
      // Update workspace if pasting to a different workspace
      if (obj.workspaceId !== activeWorkspace.id) {
        obj.workspaceId = activeWorkspace.id;
      }

      // Update position
      obj.updatePosition(obj.translateX + offsetX, obj.translateY + offsetY);

      // Update z-index
      obj.zIndex = this._store.currentZIndex + i;

      // Handle KritzelGroup: also add pending children with offset
      if (obj instanceof KritzelGroup) {
        const pendingChildren = (obj as any)._pendingChildren as KritzelBaseObject<any>[] | undefined;
        if (pendingChildren) {
          pendingChildren.forEach((child, childIndex) => {
            // Update workspace
            if (child.workspaceId !== activeWorkspace.id) {
              child.workspaceId = activeWorkspace.id;
            }

            // Update position with offset
            child.updatePosition(child.translateX + offsetX, child.translateY + offsetY);

            // Update z-index
            child.zIndex = this._store.currentZIndex + i + childIndex;

            // Add child to store
            this.addObject(child);
          });

          // Clear pending children
          delete (obj as any)._pendingChildren;

          // Finalize the group's bounding box and snapshots
          obj.finalize();
        }
      }

      // Add to objectsMap
      this.addObject(obj);

      // Add to selection group
      selectionGroup.addOrRemove(obj);
    });

    // Update line anchors to point to the newly pasted objects
    // Only remap if the anchor target was also part of the copied selection
    copiedObjects.forEach(obj => {
      if (obj instanceof KritzelLine) {
        let updated = false;

        if (obj.startAnchor && originalToNewIdMap.has(obj.startAnchor.objectId)) {
          obj.startAnchor = { objectId: originalToNewIdMap.get(obj.startAnchor.objectId)! };
          updated = true;
        }

        if (obj.endAnchor && originalToNewIdMap.has(obj.endAnchor.objectId)) {
          obj.endAnchor = { objectId: originalToNewIdMap.get(obj.endAnchor.objectId)! };
          updated = true;
        }

        // If anchors were updated, rebuild the anchor index and persist the change
        if (updated) {
          this._store.state.objects.update(obj);
        }
      }
    });

    // Rebuild anchor index after all anchor updates
    this._anchorManager.rebuildIndex();

    // Mark selection group as selected
    selectionGroup.isSelected = true;

    // Set rotation for single object
    if (copiedObjects.length === 1) {
      selectionGroup.rotation = copiedObjects[0].rotation;
    }

    // Add the selection group
    this.addSelectionGroup(selectionGroup);

    // Handle cross-workspace paste: center objects in viewport
    if (isDifferentWorkspace) {
      if (x !== undefined && y !== undefined) {
        // Position was explicitly provided, use it
        selectionGroup.updatePosition(x, y);
      } else {
        // Center the selection group in the viewport
        selectionGroup.centerInViewport();
      }
      // Fit the viewport to show the pasted objects
      this.engine.viewport.centerFitInViewport(selectionGroup);
    }

    this._store.state.isSelecting = false;

    // Update copiedObjects to the newly created objects for potential future pastes
    const newSelectionGroup = this._store.selectionGroup;
    if (newSelectionGroup) {
      // Create new copies and track the ID mapping for future pastes
      const newIdMapping = new Map<string, string>();
      const newCopiedObjects = newSelectionGroup.objects
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(obj => {
          const copiedObj = obj.copy() as KritzelBaseObject<any>;
          newIdMapping.set(copiedObj.id, obj.id);
          return copiedObj;
        });

      this._store.state.copiedObjects = newCopiedObjects;
      this._store.state.copiedObjectIdMapping = newIdMapping;
    }

    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));

    this.engine.emitObjectsChange();

    this.rerender();
  }

  bringForward(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const max = allNonSelectionObjectsWithoutCurrent.length > 0 ? Math.max(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) + 1 : 0;

    objects.forEach(obj => {
      if (obj.zIndex !== max) {
        this.updateObject(obj, { zIndex: obj.zIndex + 1 });
      }
    });

    this.rerender();
  }

  sendBackward(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const min = allNonSelectionObjectsWithoutCurrent.length > 0 ? Math.min(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) - 1 : 0;

    objects.forEach(obj => {
      if (obj.zIndex !== min) {
        this.updateObject(obj, { zIndex: obj.zIndex - 1 });
      }
    });

    this.rerender();
  }

  bringToFront(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const max = Math.max(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) + 1;

    objects.forEach(obj => {
      this.updateObject(obj, { zIndex: max });
    });

    this.rerender();
  }

  sendToBack(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const min = Math.min(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) - 1;

    objects.forEach(obj => {
      this.updateObject(obj, { zIndex: min });
    });

    this.rerender();
  }

  /**
   * Groups the currently selected objects into a KritzelGroup.
   * Requires at least 2 objects to be selected.
   */
  group(): void {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length < 2) {
      return;
    }

    // Create a group from the selected objects
    const group = KritzelGroup.createFromObjects(this, selectionGroup.objects);

    // Add the group to the object store
    this.addObject(group);

    // Remove the selection group and create a new one with just the group
    this.removeSelectionGroup();

    const newSelectionGroup = KritzelSelectionGroup.create(this);
    newSelectionGroup.addOrRemove(group);
    newSelectionGroup.isSelected = true;
    newSelectionGroup.rotation = group.rotation;
    this.addSelectionGroup(newSelectionGroup);

    this.engine.emitObjectsChange();
    this.rerender();
  }

  /**
   * Ungroups any KritzelGroup objects in the current selection.
   * Children are extracted and become top-level objects.
   */
  ungroup(): void {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    const groups = selectionGroup.objects.filter(obj => obj instanceof KritzelGroup) as KritzelGroup[];
    if (groups.length === 0) {
      return;
    }

    // Collect all children from all groups
    const allChildren: KritzelBaseObject<any>[] = [];
    const nonGroupObjects = selectionGroup.objects.filter(obj => !(obj instanceof KritzelGroup));

    groups.forEach(group => {
      // Get children before removing the group
      const children = group.ungroup();
      allChildren.push(...children);

      // Remove the group from the store (but keep children)
      this.removeObject(group, true);
    });

    // Create a new selection group with all the ungrouped children and non-group objects
    this.removeSelectionGroup();

    const newSelectionGroup = KritzelSelectionGroup.create(this);
    [...allChildren, ...nonGroupObjects].forEach(child => {
      newSelectionGroup.addOrRemove(child);
    });
    newSelectionGroup.isSelected = true;
    this.addSelectionGroup(newSelectionGroup);

    this.engine.emitObjectsChange();
    this.rerender();
  }

  selectObjects(objects: KritzelBaseObject<any>[]) {
    if (objects.length === 0) {
      return;
    }

    const selectionGroup = KritzelSelectionGroup.create(this);
    objects.forEach(obj => {
      obj.isSelected = false;
      selectionGroup.addOrRemove(obj);
    });

    selectionGroup.isSelected = true;

    if (objects.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this.addSelectionGroup(selectionGroup);
    this.rerender();
  }

  selectAllObjectsInViewport() {
    const viewportBounds = {
      x: -this._store.state.translateX / this._store.state.scale,
      y: -this._store.state.translateY / this._store.state.scale,
      z: this._store.state.scale,
      width: this._store.state.viewportWidth / this._store.state.scale,
      height: this._store.state.viewportHeight / this._store.state.scale,
      depth: 100,
    };

    const objectsInViewport = this._store.state.objects
      .query(viewportBounds)
      .filter(o => o.isInViewport())
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox) && !(o instanceof KritzelContextMenu));

    if (objectsInViewport.length > 0) {
      const selectionGroup = KritzelSelectionGroup.create(this);

      objectsInViewport.forEach(obj => {
        obj.isSelected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.isSelected = true;

      this._store.state.isSelecting = false;

      if (objectsInViewport.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }

      this.addSelectionGroup(selectionGroup);
      this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
      this.rerender();
    }
  }

  clearSelection() {
    this.removeSelectionGroup();

    this._store.state.objects.remove(o => o instanceof KritzelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.isSelecting = false;
    this._store.state.isResizeHandleSelected = false;
    this._store.state.isRotationHandleSelected = false;
    this._store.state.isLineHandleSelected = false;
    this._store.state.isLineHandleDragging = false;
    this._store.state.lineHandleType = null;

    this.rerender();
  }

  resetActiveText() {
    const activeText = this._store.activeText;
    if (activeText) {
      if (activeText.isEmpty) {
        this.deleteObject(activeText.id);
      } else {
        activeText.save();
      }
    }
  }

  resetActiveShape() {
    const activeShape = this._store.activeShape;
    if (activeShape) {
      activeShape.save();
    }
  }

  getObjectFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any> | null {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return null;

    const clientX = event.clientX;
    const clientY = event.clientY;

    const elementAtPoint = shadowRoot.elementFromPoint(clientX, clientY);
    if (!elementAtPoint) return null;

    const selectedObject = elementAtPoint.closest(selector) as HTMLElement | null;

    if (selectedObject) {
      const foundObject = this._store.allObjects.find(object => selectedObject.id === object.id);
      const isHit = foundObject?.hitTest(clientX, clientY);
      return isHit ? foundObject : null;
    }

    return null;
  }

  getObjectsFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any>[] {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return [];

    const clientX = event.clientX;
    const clientY = event.clientY;

    const elementsAtPoint = shadowRoot.elementsFromPoint(clientX, clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) return [];

    const objectIds = new Set<string>();

    elementsAtPoint.forEach(element => {
      const selectedObject = element.closest(selector) as HTMLElement | null;
      if (selectedObject && selectedObject.id) {
        objectIds.add(selectedObject.id);
      }
    });

    if (objectIds.size > 0) {
      return this._store.allObjects.filter(object => objectIds.has(object.id)).sort((a, b) => b.zIndex - a.zIndex);
    }

    return [];
  }

  /**
   * Get all elements at a pointer position that match a given selector.
   * Uses elementsFromPoint to find overlapped elements.
   */
  getElementsAtPoint(event: PointerEvent, selector: string): Element[] {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return [];

    const elementsAtPoint = shadowRoot.elementsFromPoint(event.clientX, event.clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) return [];

    return elementsAtPoint.filter(el => el.matches(selector));
  }

  /**
   * Check if any element at the pointer position matches the given selector.
   * Useful for detecting hover states on overlapped elements.
   */
  isPointerOverElement(event: PointerEvent, selector: string): boolean {
    return this.getElementsAtPoint(event, selector).length > 0;
  }

  getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    if (!this._store.state.host) {
      return { x: 0, y: 0 };
    }

    const hostRect = this._store.state.host.getBoundingClientRect();

    const xRelativeToHost = event.clientX - hostRect.left;
    const yRelativeToHost = event.clientY - hostRect.top;

    const xWithoutTranslate = xRelativeToHost - this._store.state.translateX;
    const yWithoutTranslate = yRelativeToHost - this._store.state.translateY;

    const worldX = xWithoutTranslate / this._store.state.scale;
    const worldY = yWithoutTranslate / this._store.state.scale;

    return { x: worldX, y: worldY };
  }

  beforeWorkspaceChange() {
    // Cancel any pending debounced viewport updates to prevent them from
    // saving the old workspace's viewport to the new workspace
    this._kritzelEngine.viewport?.cancelPendingUpdates();

    // Immediately save the current workspace's viewport before switching
    const currentWorkspace = this._store.state.activeWorkspace;
    if (currentWorkspace) {
      this.updateWorkspaceViewport(
        this._store.state.translateX,
        this._store.state.translateY,
        this._store.state.scale
      );
    }

    this.resetActiveText();
    this.clearSelection();
    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }

  displaySelectionGroupUI(object: KritzelBaseObject<any>): boolean {
    if (!object.isSelected) {
      return false;
    }

    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      // During selection phase (no group yet), hide UI for KritzelLine objects
      return !(object instanceof KritzelLine);
    }

    // Show UI if selection contains more than one object
    if (selectionGroup.objects.length > 1) {
      return true;
    }

    // Hide UI if selection contains a single KritzelLine
    if (selectionGroup.objects.length === 1) {
      const selectedObject = selectionGroup.objects[0];
      return !(selectedObject instanceof KritzelLine);
    }

    return true;
  }

  displaySelectionLineUI(object: KritzelBaseObject<any>): boolean {
    // Only show line UI on KritzelLine objects, not on selection groups
    if (!(object instanceof KritzelLine)) {
      return false;
    }

    // During selection phase (no group yet), show line UI if line is selected
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return object.isSelected;
    }

    if (!selectionGroup.isSelected) {
      return false;
    }

    // Show UI only if selection contains exactly one KritzelLine and it's this object
    if (selectionGroup.objects.length === 1) {
      const selectedObject = selectionGroup.objects[0];
      return selectedObject instanceof KritzelLine && selectedObject.id === object.id;
    }

    return false;
  }
}
