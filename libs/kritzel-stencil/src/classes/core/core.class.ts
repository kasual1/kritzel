import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { KritzelContextMenu } from '../../components/ui/kritzel-context-menu/kritzel-context-menu';
import { DEFAULT_ENGINE_CONFIG } from '../../configs/default-engine-config';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from './store.class';
import { KritzelWorkspace } from './workspace.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelSyncConfig } from '../../interfaces/sync-config.interface';
import { KritzelDatabase } from './database.class';

interface WorkspaceData {
  id: string;
  name: string;
  viewport?: { translateX: number; translateY: number; scale: number };
  createdAt: string;
  updatedAt: string;
}

export class KritzelCore {
  private readonly _kritzelEngine: KritzelEngine;
  private readonly _store: KritzelStore;
  private _syncConfig?: KritzelSyncConfig;
  private readonly _workspaceDB: KritzelDatabase<WorkspaceData>;

  get engine(): KritzelEngine {
    return this._kritzelEngine;
  }

  get store(): KritzelStore {
    return this._store;
  }

  constructor(kritzelEngine: KritzelEngine) {
    this._kritzelEngine = kritzelEngine;
    this._store = new KritzelStore(DEFAULT_ENGINE_CONFIG);
    this._workspaceDB = new KritzelDatabase<WorkspaceData>('kritzel-workspaces', 'workspaces');
  }

  setSyncConfig(config?: KritzelSyncConfig): void {
    this._syncConfig = config;
  }

  async initializeYjs(): Promise<void> {
    await this._workspaceDB.initialize();
  }

  /**
   * Load all workspaces from IndexedDB
   */
  private async loadWorkspacesFromDB(): Promise<KritzelWorkspace[]> {
    const workspaceData = await this._workspaceDB.getAll();
    
    return workspaceData.map((data) => {
      const workspace = new KritzelWorkspace(data.id, data.name, data.viewport);
      workspace._core = this;
      workspace.createdAt = new Date(data.createdAt);
      workspace.updatedAt = new Date(data.updatedAt);
      return workspace;
    });
  }

  /**
   * Save a workspace to IndexedDB
   */
  private async saveWorkspaceToDB(workspace: KritzelWorkspace): Promise<void> {
    const data: WorkspaceData = {
      id: workspace.id,
      name: workspace.name,
      viewport: workspace.viewport,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
    
    await this._workspaceDB.put(data);
  }

  /**
   * Delete a workspace from IndexedDB
   */
  private async deleteWorkspaceFromDB(workspaceId: string): Promise<void> {
    await this._workspaceDB.delete(workspaceId);
  }

  async initializeWorkspace(workspace?: KritzelWorkspace): Promise<void> {
    // Load all workspaces from IndexedDB
    const workspaces = await this.loadWorkspacesFromDB();

    // Find most recently updated workspace or use provided/fallback
    const mostRecentWorkspace = workspaces.length > 0 ? [...workspaces].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] : null;

    let activeWorkspace: KritzelWorkspace;

    if (workspace) {
      // Use provided workspace
      activeWorkspace = workspace;
      const existing = workspaces.find(w => w.id === workspace.id);
      if (!existing) {
        // New workspace, save it
        activeWorkspace._core = this;
        await this.saveWorkspaceToDB(activeWorkspace);
      }
    } else if (mostRecentWorkspace) {
      // Use most recent workspace
      activeWorkspace = mostRecentWorkspace;
    } else {
      // Create fallback workspace
      activeWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
      activeWorkspace._core = this;
      await this.saveWorkspaceToDB(activeWorkspace);
    }

    // Destroy old ObjectMap if switching workspaces
    if (this._store.state.objectsMap && this._store.state.objectsMap.isReady) {
      this._store.state.objectsMap.destroy();
    }

    // Set active workspace
    this._store.state.activeWorkspace = activeWorkspace;
    this._store.state.workspaces = await this.loadWorkspacesFromDB();

    // Set viewport from workspace
    const viewport = activeWorkspace.viewport ?? { translateX: 0, translateY: 0, scale: 1 };
    this._store.state.translateX = viewport.translateX ?? 0;
    this._store.state.translateY = viewport.translateY ?? 0;
    this._store.state.scale = viewport.scale ?? 1;

    // Create new ObjectMap with its own Y.Doc for this workspace
    const objectsMap = new KritzelObjectMap();
    await objectsMap.initialize(this, activeWorkspace.id, this._syncConfig);
    this._store.state.objectsMap = objectsMap;

    this.rerender();
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

  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    return await this.loadWorkspacesFromDB();
  }

  async createWorkspace(workspace: KritzelWorkspace): Promise<void> {
    workspace._core = this;
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    await this.saveWorkspaceToDB(workspace);
    this._store.state.workspaces = await this.loadWorkspacesFromDB();
  }

  async updateWorkspace(workspace: KritzelWorkspace): Promise<void> {
    workspace.updatedAt = new Date();
    await this.saveWorkspaceToDB(workspace);

    const workspaces = this._store.state.workspaces;
    const index = workspaces.findIndex(w => w.id === workspace.id);

    if (index !== -1) {
      workspaces[index] = workspace;
      this._store.state.workspaces = workspaces;
    }
  }

  async deleteWorkspace(workspace: KritzelWorkspace): Promise<void> {
    // If deleting the active workspace, need to handle ObjectMap cleanup
    if (this._store.state.activeWorkspace?.id === workspace.id) {
      this._store.state.objectsMap?.destroy();
    }

    await this.deleteWorkspaceFromDB(workspace.id);
    this._store.state.workspaces = await this.loadWorkspacesFromDB();

    // Also delete the workspace's IndexedDB database
    const dbName = `kritzel-workspace-${workspace.id}`;
    window.indexedDB.deleteDatabase(dbName);
  }

  async updateWorkspaceViewport(translateX: number, translateY: number, scale: number): Promise<void> {
    const activeWorkspace = this._store.state.activeWorkspace;
    if (!activeWorkspace) {
      return;
    }

    activeWorkspace.viewport = { translateX, translateY, scale };
    activeWorkspace.updatedAt = new Date();
    await this.saveWorkspaceToDB(activeWorkspace);
  }

  addObject(object: KritzelBaseObject<any>): void {
    this._store.state.objectsMap.insert(object);
  }

  removeObject(object: KritzelBaseObject<any>): void {
    object.isMounted = false;
    this._store.state.objectsMap.remove(o => o.id === object.id);
  }

  updateObject<T extends KritzelBaseObject<any>>(object: T, updatedProperties: Partial<T>): void {
    for (const key in updatedProperties) {
      if (updatedProperties.hasOwnProperty(key)) {
        object[key] = updatedProperties[key];
      }
    }

    this._store.state.objectsMap.update(object);
  }

  addSelectionGroup(selectionGroup: KritzelSelectionGroup): void {
    this.removeSelectionGroup();
    this.removeSelectionBox();
    this._store.state.objectsMap.insert(selectionGroup);
  }

  removeSelectionGroup(): void {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      this._store.state.objectsMap.remove(object => object.id === selectionGroup.id);
    }
  }

  removeSelectionBox(): void {
    const selectionBox = this._store.selectionBox;
    if (selectionBox) {
      this._store.state.objectsMap.remove(object => object.id === selectionBox.id);
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
    this._store.state.objectsMap?.undo();
  }

  redo(): void {
    this._store.state.objectsMap?.redo();
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
      // Copy each object and store them in an array
      this._store.state.copiedObjects = selectionGroup.objects.sort((a, b) => a.zIndex - b.zIndex).map(obj => obj.copy() as KritzelBaseObject<any>);
    }
  }

  paste(x?: number, y?: number) {
    const copiedObjects = this._store.state.copiedObjects;
    if (!copiedObjects || copiedObjects.length === 0) {
      return;
    }

    const activeWorkspace = this._store.state.activeWorkspace;

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

      // Add to objectsMap
      this.addObject(obj);

      // Add to selection group
      selectionGroup.addOrRemove(obj);
    });

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
      this._store.state.copiedObjects = newSelectionGroup.objects.sort((a, b) => a.zIndex - b.zIndex).map(obj => obj.copy() as KritzelBaseObject<any>);
    }

    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
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
    const objectsInViewport = this._store.state.objectsMap
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

    this._store.state.objectsMap.remove(o => o instanceof KritzelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.isSelecting = false;
    this._store.state.isResizeHandleSelected = false;
    this._store.state.isRotationHandleSelected = false;

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
    this.resetActiveText();
    this.clearSelection();
    this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }
}
