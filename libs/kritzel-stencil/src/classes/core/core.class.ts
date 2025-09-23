import { KritzelEngine } from '../../components/core/kritzel-engine/kritzel-engine';
import { KritzelContextMenu } from '../../components/ui/kritzel-context-menu/kritzel-context-menu';
import { DEFAULT_ENGINE_STATE } from '../../configs/default-engine-state';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { AddObjectCommand } from '../commands/add-object.command';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { BatchCommand } from '../commands/batch.command';
import { RemoveObjectCommand } from '../commands/remove-object.command';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { KritzelDatabase } from '../database.class';
import { KritzelHistory } from '../history.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelReviver } from '../reviver.class';
import { KritzelStore } from '../store.class';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelWorkspace } from '../workspace.class';

export class KritzelCore {
  private readonly _kritzelEngine: KritzelEngine;
  private readonly _store: KritzelStore;
  private readonly _state: KritzelEngineState;
  private readonly _history: KritzelHistory;
  private readonly _database: KritzelDatabase;
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  get history(): KritzelHistory {
    return this._history;
  }

  get database(): KritzelDatabase {
    return this._database;
  }

  constructor(kritzelEngine: KritzelEngine) {
    this._state = DEFAULT_ENGINE_STATE;
    this._kritzelEngine = kritzelEngine;
    this._store = new KritzelStore(this._kritzelEngine);
    this._history = new KritzelHistory(this._store);
    this._database = new KritzelDatabase('kritzelDB', 1, this._state.debugInfo.logDatabase);
    this._state.objectsMap = new KritzelObjectMap();
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
  
      this._state.activeWorkspace = workspace ?? mostRecentWorkspace ?? fallbackWorkspace;
  
      const isExistingWorkspace = await this.getWorkspace(this._state.activeWorkspace.id);
  
      if (isExistingWorkspace) {
        await this.updateWorkspace(this._state.activeWorkspace);
      } else {
        await this.createWorkspace(this._state.activeWorkspace);
      }
  
      this._state.workspaces = await this.getWorkspaces();
  
      this._store.state.translateX = this._state.activeWorkspace.viewport.translateX;
      this._store.state.translateY = this._state.activeWorkspace.viewport.translateY;
      this._store.state.scale = this._state.activeWorkspace.viewport.scale;
  
      await this.initializeWorkspaceObjects(this._state.activeWorkspace.id);
    }
  
    private async initializeWorkspaceObjects(workspaceId: string): Promise<void> {
      this._state.objectsMap.reset();
      this._history.reset();
  
      const objectsFromDb = await this._database.getAllByRange<any>('objects', IDBKeyRange.bound([workspaceId], [workspaceId, '\uffff']));
  
      const reviver = new KritzelReviver(this._store);
  
      objectsFromDb.forEach(element => {
        const revivedObject = reviver.revive<KritzelBaseObject<any>>(element);
        this._state.objectsMap.insert(revivedObject);
      });
  
      this.rerender();
    }
  
    async updateWorkspaceViewport(translateX: number, translateY: number, scale: number) {
      if (!this._store.state.activeWorkspace) {
        throw new Error('Workspace not initialized');
      }
  
      this._store.state.activeWorkspace.viewport = {
        translateX,
        translateY,
        scale,
      };
  
      this._store.state.activeWorkspace.updatedAt = new Date();
  
      await this._database.update('workspaces', this._store.state.activeWorkspace);
    }
  
    async addObjectToDatabase(object: KritzelBaseObject<any>): Promise<void> {
      if (!this._database) {
        throw new Error('Database not initialized');
      }
  
      if (!this._store.state.activeWorkspace) {
        throw new Error('Workspace not initialized');
      }
  
      this._store.state.activeWorkspace.updatedAt = new Date();

      await this._database.batch([db => db.add('objects', object), db => db.update('workspaces', this._store.state.activeWorkspace)]).catch(err => {
        console.error('Error adding object to database:', err);
      });
    }
  
    async updateObjectInDatabase(object: KritzelBaseObject<any>): Promise<void> {
      if (!this._database) {
        throw new Error('Database not initialized');
      }
  
      if (!this._store.state.activeWorkspace) {
        throw new Error('Workspace not initialized');
      }
  
      this._store.state.activeWorkspace.updatedAt = new Date();
  
      await this._database.batch([db => db.update('objects', object), db => db.update('workspaces', this._store.state.activeWorkspace)]).catch(err => {
        console.error('Error updating object in database:', err);
      });
    }
  
    async deleteObjectFromDatabase(objectId: string): Promise<void> {
      if (!this._database) {
        throw new Error('Database not initialized');
      }
  
      if (!this._store.state.activeWorkspace) {
        throw new Error('Workspace not initialized');
      }
  
      this._store.state.activeWorkspace.updatedAt = new Date();
  
      await this._database.batch([db => db.delete('objects', [this._store.state.activeWorkspace.id, objectId]), db => db.update('workspaces', this._store.state.activeWorkspace)]).catch(err => {
        console.error('Error deleting object from database:', err);
      });
    }
  
    getWorkspace(id: string): Promise<KritzelWorkspace | null> {
      if (!this._database) {
        throw new Error('Database not initialized');
      }
  
      return this._database.get<KritzelWorkspace>('workspaces', id);
    }
  
    getWorkspaces(): Promise<KritzelWorkspace[]> {
      if (!this._database) {
        throw new Error('Database not initialized');
      }
  
      return this._database.getAll<KritzelWorkspace>('workspaces');
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
  
      const index = this._store.state.workspaces.findIndex(w => w.id === workspace.id);
      if (index !== -1) {
        this._store.state.workspaces[index] = workspace;
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

  deselectAllObjects(): void {
    if (this._state.selectionGroup) {
      this._history.executeCommand(new RemoveSelectionGroupCommand(this._store, this));
    }
  }

  onStateChange<K extends StatePropertyKey>(property: K, listener: StateChangeListener<KritzelEngineState[K]>): void {
    if (!this._listeners.has(property)) {
      this._listeners.set(property, new Set());
    }
    this._listeners.get(property).add(listener);
  }

  setState<K extends StatePropertyKey>(property: K, value: KritzelEngineState[K]): void {
    const oldValue = this._state[property];

    if (oldValue !== value) {
      this._state[property] = value;

      if (this._listeners.has(property)) {
        this._listeners.get(property).forEach(listener => listener(value, oldValue, String(property)));
      }
    }
  }

  delete() {
    if (!this._store.state.selectionGroup) {
      return;
    }

    const deleteSelectedObjectsCommand = this._store.state.selectionGroup.objects.map(obj => new RemoveObjectCommand(this._store, this._store.state.selectionGroup, obj));
    const removeSelectionGroupCommand = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    const commands = [...deleteSelectedObjectsCommand, removeSelectionGroupCommand];

    this.history.executeCommand(new BatchCommand(this._store, this._store.state.selectionGroup, commands));
  }

  deleteObject(id: string, skipHistory: boolean = false) {
    const object = this.findObjectById(id);
    if (object) {
      const removeObjectCommand = new RemoveObjectCommand(this._store, this, object, skipHistory);
      this.history.executeCommand(removeObjectCommand);
    }
  }

  copy() {
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  paste(x?: number, y?: number) {
    this._store.state.copiedObjects.isSelected = true;

    const adjustedX = x !== undefined ? x : this._store.state.copiedObjects.translateX + 25;
    const adjustedY = y !== undefined ? y : this._store.state.copiedObjects.translateY + 25;

    this._store.state.copiedObjects.updatePosition(adjustedX, adjustedY);

    const commands = [];
    if (this._store.state.selectionGroup !== null) {
      commands.push(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
    }

    const addCopiedObjectsCommands = this._store.state.copiedObjects.objects.map(obj => new AddObjectCommand(this._store, this, obj));
    const addCopiedObjectsAsSelectionGroupCommand = new AddSelectionGroupCommand(this._store, this, this._store.state.copiedObjects);

    commands.push(...addCopiedObjectsCommands, addCopiedObjectsAsSelectionGroupCommand);

    this.history.executeCommand(new BatchCommand(this, this, commands));

    this._store.state.isSelecting = false;
    this._store.state.copiedObjects = this._store.state.selectionGroup.copy() as KritzelSelectionGroup;
    this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }

  bringForward(object?: KritzelBaseObject<any>) {
    const max = this._store.allObjects.length + 1;
    const objects = object ? [object] : this._store.state.selectionGroup.objects;
    const increaseZIndexCommands = objects.map(obj => {
      if (obj.zIndex === max) {
        return;
      }
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex + 1 });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  sendBackward(object?: KritzelBaseObject<any>) {
    const min = 0;
    const objects = object ? [object] : this._store.state.selectionGroup.objects;
    const decreaseZIndexCommands = objects.map(obj => {
      if (obj.zIndex === min) {
        return;
      }
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: obj.zIndex - 1 });
    });

    this.history.executeCommand(new BatchCommand(this._store, this, decreaseZIndexCommands));
  }

  bringToFront(object?: KritzelBaseObject<any>) {
    const max = Math.max(...this._store.allObjects.map(obj => obj.zIndex)) + 1;
    const objects = object ? [object] : this._store.state.selectionGroup.objects;
    const increaseZIndexCommands = objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: max });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  sendToBack(object?: KritzelBaseObject<any>) {
    const min = Math.min(...this._store.allObjects.map(obj => obj.zIndex)) - 1;
    const objects = object ? [object] : this._store.state.selectionGroup.objects;
    const decreaseZIndexCommands = objects.map(obj => {
      return new UpdateObjectCommand(this._store, this, obj, { zIndex: min });
    });

    this.history.executeCommand(new BatchCommand(this, this, decreaseZIndexCommands));
  }

  selectObjects(objects: KritzelBaseObject<any>[]) {
    if (objects.length === 0) {
      return;
    }

    const selectionGroup = KritzelSelectionGroup.create(this._store);
    objects.forEach(obj => {
      obj.isSelected = false;
      selectionGroup.addOrRemove(obj);
    });

    selectionGroup.isSelected = true;

    this._store.state.selectionGroup = selectionGroup;

    if (objects.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this.history.executeCommand(new AddSelectionGroupCommand(this, this, selectionGroup));
  }

  selectAllObjectsInViewport() {
    const objectsInViewport = this._state.objectsMap
      .filter(o => o.isInViewport())
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox) && !(o instanceof KritzelContextMenu));

    if (objectsInViewport.length > 0) {
      const selectionGroup = KritzelSelectionGroup.create(this._store);

      objectsInViewport.forEach(obj => {
        obj.isSelected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.isSelected = true;

      this._store.state.isSelecting = false;

      if (objectsInViewport.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }

      this.history.executeCommand(new AddSelectionGroupCommand(this, this, selectionGroup));
      this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    }
  }

  clearSelection() {
    const command = new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup);
    this.history.executeCommand(command);

    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = null;
    this._store.state.isSelecting = false;
    this._store.state.isResizeHandleSelected = false;
    this._store.state.isRotationHandleSelected = false;
  }

  resetActiveText() {
    if (this._store.state.activeText && this._store.state.activeText.value === ' ') {
      this.deleteObject(this._store.state.activeText.id, true);
    }

    this._store.state.activeText = null;
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
      return this._store.allObjects.find(object => selectedObject.id === object.id);
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

  public getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    if (!this._store.state.host) {
      return { x: 0, y: 0 };
    }

    // Get the position of the kritzel-engine host element relative to the viewport
    const hostRect = this._store.state.host.getBoundingClientRect();

    // 1. Make the pointer coordinates relative to the host element
    const xRelativeToHost = event.clientX - hostRect.left;
    const yRelativeToHost = event.clientY - hostRect.top;

    // 2. Reverse the translation applied to the #origin div
    const xWithoutTranslate = xRelativeToHost - this._store.state.translateX;
    const yWithoutTranslate = yRelativeToHost - this._store.state.translateY;

    // 3. Reverse the scaling to get the final world coordinates
    const worldX = xWithoutTranslate / this._store.state.scale;
    const worldY = yWithoutTranslate / this._store.state.scale;

    return { x: worldX, y: worldY };
  }
}
