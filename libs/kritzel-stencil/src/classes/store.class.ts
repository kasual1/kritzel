import { KritzelBaseObject } from './objects/base-object.class';
import { KritzelSelectionGroup } from './objects/selection-group.class';
import { RemoveSelectionGroupCommand } from './commands/remove-selection-group.command';
import { KritzelHistory } from './history.class';
import { KritzelEngineState } from '../interfaces/engine-state.interface';
import { KritzelOctree } from './structures/octree.structure';
import { KritzelBoundingBox } from '../interfaces/bounding-box.interface';
import { KrtizelSelectionBox } from './objects/selection-box.class';
import { StateChangeListener, StatePropertyKey } from '../types/state.types';
import { RemoveObjectCommand } from './commands/remove-object.command';
import { BatchCommand } from './commands/batch.command';
import { AddObjectCommand } from './commands/add-object.command';
import { AddSelectionGroupCommand } from './commands/add-selection-group.command';
import { UpdateObjectCommand } from './commands/update-object.command';
import { KritzelEngine } from '../components/core/kritzel-engine/kritzel-engine';
import { KritzelContextMenu } from '../components/ui/kritzel-context-menu/kritzel-context-menu';
import { KritzelToolRegistry } from './registries/tool.registry';
import { DEFAULT_ENGINE_STATE } from '../configs/default-engine-state';
import { KritzelDatabase } from './database.class';
import { KritzelReviver } from './reviver.class';
import { KritzelWorkspace } from './workspace.class';
import { ObjectHelper } from '../helpers/object.helper';

export class KritzelStore {
  private readonly _kritzelEngine: KritzelEngine;

  private readonly _state: KritzelEngineState;

  private _workspace: KritzelWorkspace;

  private readonly _history: KritzelHistory;

  private readonly _database: KritzelDatabase;

  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  objects: KritzelBaseObject<any>[] = [];

  get history(): KritzelHistory {
    return this._history;
  }

  get workspace(): KritzelWorkspace {
    return this._workspace;
  }

  get database(): KritzelDatabase {
    return this._database;
  }

  get state(): KritzelEngineState {
    return this._state;
  }

  get currentZIndex() {
    return this._state.objectsOctree.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox)).length;
  }

  get allObjects() {
    return this._state.objectsOctree.allObjects();
  }

  get selectedObjects() {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.isSelected);
  }

  get offsetX() {
    return this._state.host.getBoundingClientRect().left;
  }

  get offsetY() {
    return this._state.host.getBoundingClientRect().top;
  }

  constructor(kritzelEngine: KritzelEngine) {
    this._state = DEFAULT_ENGINE_STATE;
    this._kritzelEngine = kritzelEngine;
    this._history = new KritzelHistory(this);
    this._database = new KritzelDatabase('kritzelDB', 1);
    this._state.objectsOctree = new KritzelOctree<KritzelBaseObject<any>>({
      x: -Infinity,
      y: -Infinity,
      z: -Infinity,
      width: Infinity,
      height: Infinity,
      depth: Infinity,
    });
  }

  async initializeDatabase(): Promise<void> {
    await this._database.open([
      {
        name: 'objects',
        options: { keyPath: 'id' },
      },
      { name: 'workspaces', options: { keyPath: 'id' } },
    ]);

    const workspacesFromDb = await this._database.getAll<any>('workspaces');

    if (workspacesFromDb.length > 0) {
      const mostRecentWorkspace = workspacesFromDb.reduce((latest, current) => {
        return new Date(latest.updatedAt) > new Date(current.updatedAt) ? latest : current;
      });
      this._workspace = new KritzelWorkspace(mostRecentWorkspace.id, mostRecentWorkspace.name);
      this._workspace.updatedAt = mostRecentWorkspace.updatedAt;
      this._workspace.createdAt = mostRecentWorkspace.createdAt;
      this._workspace.viewport = mostRecentWorkspace.viewport;
      this.state.translateX = this._workspace.viewport.translateX;
      this.state.translateY = this._workspace.viewport.translateY;
      this.state.scale = this._workspace.viewport.scale;
    } else {
      this._workspace = new KritzelWorkspace(ObjectHelper.generateUUID(), 'New Workspace');
      await this._database.add('workspaces', this._workspace);
    }

    const objectsFromDb = await this._database.getAll<any>('objects');

    const reviver = new KritzelReviver(this);

    objectsFromDb.forEach(element => {
      const revivedObject = reviver.revive<KritzelBaseObject<any>>(element);
      this._state.objectsOctree.insert(revivedObject);
    });

    this.rerender();
  }

  async updateWorkspaceViewport(translateX: number, translateY: number, scale: number) {
    if (!this._workspace) {
      throw new Error('Workspace not initialized');
    }

    this._workspace.viewport = {
      translateX,
      translateY,
      scale,
    };

    this._workspace.updatedAt = new Date();

    await this._database.update('workspaces', this._workspace);
  }

  rerender() {
    const viewportBounds: KritzelBoundingBox = {
      x: -this._state.translateX / this._state.scale,
      y: -this._state.translateY / this._state.scale,
      z: this._state.scale,
      width: this._state.viewportWidth / this._state.scale,
      height: this._state.viewportHeight / this._state.scale,
      depth: 100,
    };

    this.objects = this._state.objectsOctree.query(viewportBounds);

    if (this._kritzelEngine) {
      this._kritzelEngine.forceUpdate++;
    }
  }

  findObjectById(id: string): KritzelBaseObject<any> | null {
    for (const object of this.allObjects) {
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  deselectAllObjects(): void {
    if (this._state.selectionGroup) {
      this._history.executeCommand(new RemoveSelectionGroupCommand(this, this));
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
    if (!this.state.selectionGroup) {
      return;
    }

    const deleteSelectedObjectsCommand = this.state.selectionGroup.objects.map(obj => new RemoveObjectCommand(this, this.state.selectionGroup, obj));
    const removeSelectionGroupCommand = new RemoveSelectionGroupCommand(this, this.state.selectionGroup);
    const commands = [...deleteSelectedObjectsCommand, removeSelectionGroupCommand];

    this.history.executeCommand(new BatchCommand(this, this.state.selectionGroup, commands));
  }

  deleteObject(id: string, skipHistory: boolean = false) {
    const object = this.findObjectById(id);
    if (object) {
      const removeObjectCommand = new RemoveObjectCommand(this, this, object, skipHistory);
      this.history.executeCommand(removeObjectCommand);
    }
  }

  copy() {
    this.state.copiedObjects = this.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  paste(x?: number, y?: number) {
    this.state.copiedObjects.isSelected = true;

    const adjustedX = x !== undefined ? x : this.state.copiedObjects.translateX + 25;
    const adjustedY = y !== undefined ? y : this.state.copiedObjects.translateY + 25;

    this.state.copiedObjects.updatePosition(adjustedX, adjustedY);

    const commands = [];
    if (this.state.selectionGroup !== null) {
      commands.push(new RemoveSelectionGroupCommand(this, this.state.selectionGroup));
    }

    const addCopiedObjectsCommands = this.state.copiedObjects.objects.map(obj => new AddObjectCommand(this, this, obj));
    const addCopiedObjectsAsSelectionGroupCommand = new AddSelectionGroupCommand(this, this, this.state.copiedObjects);

    commands.push(...addCopiedObjectsCommands, addCopiedObjectsAsSelectionGroupCommand);

    this.history.executeCommand(new BatchCommand(this, this, commands));

    this.state.isSelecting = false;
    this.state.copiedObjects = this.state.selectionGroup.copy() as KritzelSelectionGroup;
    this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }

  bringForward(object?: KritzelBaseObject<any>) {
    const max = this.allObjects.length + 1;
    const objects = object ? [object] : this.state.selectionGroup.objects;
    const increaseZIndexCommands = objects.map(obj => {
      if (obj.zIndex === max) {
        return;
      }
      return new UpdateObjectCommand(this, this, obj, { zIndex: obj.zIndex + 1 });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  sendBackward(object?: KritzelBaseObject<any>) {
    const min = 0;
    const objects = object ? [object] : this.state.selectionGroup.objects;
    const decreaseZIndexCommands = objects.map(obj => {
      if (obj.zIndex === min) {
        return;
      }
      return new UpdateObjectCommand(this, this, obj, { zIndex: obj.zIndex - 1 });
    });

    this.history.executeCommand(new BatchCommand(this, this, decreaseZIndexCommands));
  }

  bringToFront(object?: KritzelBaseObject<any>) {
    const max = Math.max(...this.allObjects.map(obj => obj.zIndex)) + 1;
    const objects = object ? [object] : this.state.selectionGroup.objects;
    const increaseZIndexCommands = objects.map(obj => {
      return new UpdateObjectCommand(this, this, obj, { zIndex: max });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  sendToBack(object?: KritzelBaseObject<any>) {
    const min = Math.min(...this.allObjects.map(obj => obj.zIndex)) - 1;
    const objects = object ? [object] : this.state.selectionGroup.objects;
    const decreaseZIndexCommands = objects.map(obj => {
      return new UpdateObjectCommand(this, this, obj, { zIndex: min });
    });

    this.history.executeCommand(new BatchCommand(this, this, decreaseZIndexCommands));
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

    this.state.selectionGroup = selectionGroup;

    if (objects.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this.history.executeCommand(new AddSelectionGroupCommand(this, this, selectionGroup));
  }

  selectAllObjectsInViewport() {
    const objectsInViewport = this._state.objectsOctree
      .query({
        x: -this._state.translateX / this._state.scale,
        y: -this._state.translateY / this._state.scale,
        z: this._state.scale,
        width: this._state.viewportWidth / this._state.scale,
        height: this._state.viewportHeight / this._state.scale,
        depth: 100,
      })
      .filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox) && !(o instanceof KritzelContextMenu));

    if (objectsInViewport.length > 0) {
      const selectionGroup = KritzelSelectionGroup.create(this);

      objectsInViewport.forEach(obj => {
        obj.isSelected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.isSelected = true;

      this.state.isSelecting = false;

      if (objectsInViewport.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }

      this.history.executeCommand(new AddSelectionGroupCommand(this, this, selectionGroup));
      this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    }
  }

  clearSelection() {
    const command = new RemoveSelectionGroupCommand(this, this.state.selectionGroup);
    this.history.executeCommand(command);

    this.state.selectionGroup = null;
    this.state.selectionBox = null;
    this.state.isSelecting = false;
    this.state.isResizeHandleSelected = false;
    this.state.isRotationHandleSelected = false;
  }

  resetActiveText() {
    if (this.state.activeText && this.state.activeText.value === ' ') {
      this.deleteObject(this.state.activeText.id, true);
    }

    this.state.activeText = null;
  }

  getObjectFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any> | null {
    const shadowRoot = this.state.host?.shadowRoot;
    if (!shadowRoot) return null;

    const clientX = event.clientX;
    const clientY = event.clientY;

    const elementAtPoint = shadowRoot.elementFromPoint(clientX, clientY);
    if (!elementAtPoint) return null;

    const selectedObject = elementAtPoint.closest(selector) as HTMLElement | null;

    if (selectedObject) {
      return this.allObjects.find(object => selectedObject.id === object.id);
    }

    return null;
  }

  getObjectsFromPointerEvent(event: PointerEvent, selector = '.object'): KritzelBaseObject<any>[] {
    const shadowRoot = this.state.host?.shadowRoot;
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
      return this.allObjects.filter(object => objectIds.has(object.id)).sort((a, b) => b.zIndex - a.zIndex);
    }

    return [];
  }

  public getCanvasPoint(event: PointerEvent): { x: number; y: number } {
    if (!this.state.host) {
      return { x: 0, y: 0 };
    }

    // Get the position of the kritzel-engine host element relative to the viewport
    const hostRect = this.state.host.getBoundingClientRect();

    // 1. Make the pointer coordinates relative to the host element
    const xRelativeToHost = event.clientX - hostRect.left;
    const yRelativeToHost = event.clientY - hostRect.top;

    // 2. Reverse the translation applied to the #origin div
    const xWithoutTranslate = xRelativeToHost - this.state.translateX;
    const yWithoutTranslate = yRelativeToHost - this.state.translateY;

    // 3. Reverse the scaling to get the final world coordinates
    const worldX = xWithoutTranslate / this.state.scale;
    const worldY = yWithoutTranslate / this.state.scale;

    return { x: worldX, y: worldY };
  }
}
