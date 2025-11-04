import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { KritzelContextMenu } from '../../components/ui/kritzel-context-menu/kritzel-context-menu';
import { DEFAULT_ENGINE_STATE } from '../../configs/default-engine-state';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelDatabase } from './database.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelReviver } from './reviver.class';
import { KritzelStore } from './store.class';
import { KritzelWorkspace } from './workspace.class';

export class KritzelCore {
  private readonly _kritzelEngine: KritzelEngine;
  private readonly _store: KritzelStore;
  private readonly _database: KritzelDatabase;

  get engine(): KritzelEngine {
    return this._kritzelEngine;
  }

  get database(): KritzelDatabase {
    return this._database;
  }

  get store(): KritzelStore {
    return this._store;
  }

  constructor(kritzelEngine: KritzelEngine) {
    this._kritzelEngine = kritzelEngine;
    this._store = new KritzelStore(DEFAULT_ENGINE_STATE);
    this._database = new KritzelDatabase('kritzelDB', 1, this._store.state.debugInfo.logDatabase);
  }

  async initializeDatabase(): Promise<void> {
    await this._database.open([
      {
        name: 'objects',
        options: { keyPath: ['workspaceId', 'id'] },
      },
      { name: 'workspaces', options: { keyPath: 'id' } },
    ]);

    this.rerender();
  }

  async initializeWorkspace(workspace?: KritzelWorkspace): Promise<void> {
    const workspaces = await this.getWorkspaces();
    const mostRecentWorkspace = [...workspaces].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    const fallbackWorkspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');

    const candidateWorkspace = workspace ?? mostRecentWorkspace ?? fallbackWorkspace;
    const existingWorkspace = await this.getWorkspace(candidateWorkspace.id);

    if (existingWorkspace) {
      this._store.state.activeWorkspace = existingWorkspace;
      await this.updateWorkspace(this._store.state.activeWorkspace);
    } else {
      this._store.state.activeWorkspace = candidateWorkspace;
      await this.createWorkspace(this._store.state.activeWorkspace);
    }

    this._store.state.workspaces = await this.getWorkspaces();

    const viewport = this._store.state.activeWorkspace.viewport ?? { translateX: 0, translateY: 0, scale: 1 };

    this._store.state.translateX = viewport.translateX ?? 0;
    this._store.state.translateY = viewport.translateY ?? 0;
    this._store.state.scale = viewport.scale ?? 1;

    await this.initializeWorkspaceObjects(this._store.state.activeWorkspace.id);
  }

  private async initializeWorkspaceObjects(workspaceId: string): Promise<void> {
    this._store.state.objectsMap.reset();

    const objectsFromDb = await this._database.getAllByRange<any>('objects', IDBKeyRange.bound([workspaceId], [workspaceId, '\uffff']));

    const reviver = new KritzelReviver(this);

    objectsFromDb.forEach(element => {
      const revivedObject = reviver.revive<KritzelBaseObject<any>>(element);
      this._store.state.objectsMap.insert(revivedObject);
    });

    this.rerender();
  }

  async updateWorkspaceViewport(translateX: number, translateY: number, scale: number) {
    const activeWorkspace = this._store.state.activeWorkspace;

    if (!activeWorkspace) {
      throw new Error('Workspace not initialized');
    }

    activeWorkspace.viewport = { translateX, translateY, scale };
    activeWorkspace.updatedAt = new Date();

    await this._database.update('workspaces', activeWorkspace);
  }

  async addObjectToDatabase(object: KritzelBaseObject<any>): Promise<void> {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const activeWorkspace = this._store.state.activeWorkspace;

    if (!activeWorkspace) {
      throw new Error('Workspace not initialized');
    }

    activeWorkspace.updatedAt = new Date();

    await this._database.batch([db => db.add('objects', object), db => db.update('workspaces', activeWorkspace)]).catch(err => {
      console.error('Error adding object to database:', err);
    });
  }

  async updateObjectInDatabase(object: KritzelBaseObject<any>): Promise<void> {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const activeWorkspace = this._store.state.activeWorkspace;

    if (!activeWorkspace) {
      throw new Error('Workspace not initialized');
    }

    activeWorkspace.updatedAt = new Date();

    await this._database.batch([db => db.update('objects', object), db => db.update('workspaces', activeWorkspace)]).catch(err => {
      console.error('Error updating object in database:', err);
    });
  }

  async deleteObjectFromDatabase(objectId: string): Promise<void> {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const activeWorkspace = this._store.state.activeWorkspace;

    if (!activeWorkspace) {
      throw new Error('Workspace not initialized');
    }

    activeWorkspace.updatedAt = new Date();

    await this._database.batch([db => db.delete('objects', [activeWorkspace.id, objectId]), db => db.update('workspaces', activeWorkspace)]).catch(err => {
      console.error('Error deleting object from database:', err);
    });
  }

  async getWorkspace(id: string): Promise<KritzelWorkspace | null> {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const reviver = new KritzelReviver(this);

    return this._database.get<KritzelWorkspace>('workspaces', id).then(rawWorkspace => (rawWorkspace ? reviver.revive<KritzelWorkspace>(rawWorkspace) : null));
  }

  async getWorkspaces(): Promise<KritzelWorkspace[]> {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const reviver = new KritzelReviver(this);

    return this._database.getAll<KritzelWorkspace>('workspaces').then(rawWorkspaces => rawWorkspaces.map(ws => reviver.revive<KritzelWorkspace>(ws)));
  }

  async createWorkspace(workspace: KritzelWorkspace) {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();

    await this._database.add('workspaces', workspace);

    this._store.state.workspaces.push(workspace);
  }

  async updateWorkspace(workspace: KritzelWorkspace) {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    workspace.updatedAt = new Date();

    await this._database.update('workspaces', workspace);

    const workspaces = this._store.state.workspaces;
    const index = workspaces.findIndex(w => w.id === workspace.id);

    if (index !== -1) {
      workspaces[index] = workspace;
      this._store.state.workspaces = workspaces;
    }
  }

  async deleteWorkspace(workspace: KritzelWorkspace) {
    if (!this._database) {
      throw new Error('Database not initialized');
    }

    const objectRange = IDBKeyRange.bound([workspace.id], [workspace.id, '\uffff']);

    await this._database.deleteByRange('objects', objectRange);

    await this._database.delete('workspaces', workspace.id);

    this._store.state.workspaces = this._store.state.workspaces.filter(ws => ws.id !== workspace.id);
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

  // Direct action methods (replacing command pattern)
  addObjectDirect(object: KritzelBaseObject<any>): void {
    this._store.state.objectsMap.insert(object);
    this.addObjectToDatabase(object);
  }

  removeObjectDirect(object: KritzelBaseObject<any>): void {
    object.isMounted = false;
    this._store.state.objectsMap.remove(o => o.id === object.id);
    this.deleteObjectFromDatabase(object.id);
  }

  updateObjectDirect<T extends KritzelBaseObject<any>>(object: T, updatedProperties: Partial<T>): void {
    for (const key in updatedProperties) {
      if (updatedProperties.hasOwnProperty(key)) {
        object[key] = updatedProperties[key];
      }
    }

    object.onExecuteUpdateCommand(updatedProperties);

    this._store.state.objectsMap.update(object);
    this.updateObjectInDatabase(object);
  }

  addSelectionGroupDirect(selectionGroup: KritzelSelectionGroup): void {
    this._store.state.objectsMap.remove(object => object instanceof KrtizelSelectionBox || object instanceof KritzelSelectionGroup);
    this._store.state.objectsMap.insert(selectionGroup);
  }

  removeSelectionGroupDirect(): void {
    const previousSelectionGroup = this._store.selectionGroup;
    if (previousSelectionGroup) {
      this._store.state.objectsMap.remove(object => object.id === previousSelectionGroup.id);
    }
  }

  moveSelectionGroup(startX: number, startY: number, endX: number, endY: number): void {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      selectionGroup.move(startX, startY, endX, endY);
      selectionGroup.objects.forEach(object => {
        this._store.state.objectsMap.update(object);
        this.updateObjectInDatabase(object);
      });
    }
  }

  resizeSelectionGroup(x: number, y: number, width: number, height: number): void {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      selectionGroup.resize(x, y, width, height);
      selectionGroup.objects.forEach(object => {
        this._store.state.objectsMap.update(object);
        this.updateObjectInDatabase(object);
      });
    }
  }

  rotateSelectionGroup(rotation: number): void {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      selectionGroup.rotate(rotation);
      selectionGroup.objects.forEach(object => {
        this._store.state.objectsMap.update(object);
        this.updateObjectInDatabase(object);
      });
    }
  }

  deselectAllObjects(): void {
    this.removeSelectionGroupDirect();
    this.rerender();
  }

  delete() {
    const selectionGroup = this._store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    // Delete all selected objects
    selectionGroup.objects.forEach(obj => this.removeObjectDirect(obj));
    // Remove the selection group itself
    this.removeSelectionGroupDirect();
    this.rerender();
  }

  deleteObject(id: string) {
    const object = this.findObjectById(id);
    if (object) {
      this.removeObjectDirect(object);
      this.rerender();
    }
  }

  copy() {
    const selectionGroup = this._store.selectionGroup;
    if (selectionGroup) {
      this._store.state.copiedObjects = selectionGroup.copy() as KritzelSelectionGroup;
    }
  }

  paste(x?: number, y?: number) {
    const copiedObjects = this._store.state.copiedObjects;
    copiedObjects.isSelected = true;

    this._store.state.copiedObjects = copiedObjects;

    const adjustedX = x !== undefined ? x : this._store.state.copiedObjects.translateX + 25 / this._store.state.scale;
    const adjustedY = y !== undefined ? y : this._store.state.copiedObjects.translateY + 25 / this._store.state.scale;

    this._store.state.copiedObjects.updatePosition(adjustedX, adjustedY);
    this._store.state.copiedObjects.updateZIndices(this._store.currentZIndex);

    const activeWorkspace = this._store.state.activeWorkspace;
    if (this.store.state.copiedObjects.workspaceId !== activeWorkspace.id) {
      this.store.state.copiedObjects.updateWorkspaceId(activeWorkspace.id);

      if (x !== undefined && y !== undefined) {
        this._store.state.copiedObjects.updatePosition(x, y);
      } else {
        this.store.state.copiedObjects.centerInViewport();
      }
      this.engine.viewport.centerFitInViewport(copiedObjects);
    }

    const currentSelectionGroup = this._store.selectionGroup;
    if (currentSelectionGroup !== null) {
      this.removeSelectionGroupDirect();
    }

    // Add all copied objects
    this._store.state.copiedObjects.objects.forEach(obj => this.addObjectDirect(obj));
    // Add the selection group
    this.addSelectionGroupDirect(this._store.state.copiedObjects);

    this._store.state.isSelecting = false;
    const newSelectionGroup = this._store.selectionGroup;
    if (newSelectionGroup) {
      this._store.state.copiedObjects = newSelectionGroup.copy() as KritzelSelectionGroup;
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
        this.updateObjectDirect(obj, { zIndex: obj.zIndex + 1 });
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
        this.updateObjectDirect(obj, { zIndex: obj.zIndex - 1 });
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
      this.updateObjectDirect(obj, { zIndex: max });
    });

    this.rerender();
  }

  sendToBack(object?: KritzelBaseObject<any>) {
    const selectionGroup = this._store.selectionGroup;
    const objects = object ? [object] : selectionGroup?.objects || [];
    const allNonSelectionObjectsWithoutCurrent = this._store.allNonSelectionObjects.filter(o => objects.findIndex(obj => obj.id === o.id) === -1);
    const min = Math.min(...allNonSelectionObjectsWithoutCurrent.map(obj => obj.zIndex)) - 1;
    
    objects.forEach(obj => {
      this.updateObjectDirect(obj, { zIndex: min });
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

    this.addSelectionGroupDirect(selectionGroup);
    this.rerender();
  }

  selectAllObjectsInViewport() {
    const objectsInViewport = this._store.state.objectsMap
      .filter(o => o.isInViewport())
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox) && !(o instanceof KritzelContextMenu));

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

      this.addSelectionGroupDirect(selectionGroup);
      this._store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
      this.rerender();
    }
  }

  clearSelection() {
    this.removeSelectionGroupDirect();

    this._store.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.isSelecting = false;
    this._store.state.isResizeHandleSelected = false;
    this._store.state.isRotationHandleSelected = false;

    this.rerender();
  }

  resetActiveText() {
    const activeText = this._store.activeText;
    if (activeText) {
      if(activeText.isEmpty) {
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
