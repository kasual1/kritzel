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

export class KritzelStore {
  private readonly _kritzelEngine: KritzelEngine;

  private readonly _state: KritzelEngineState;

  private readonly _history: KritzelHistory;

  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  objects: KritzelBaseObject<any>[] = [];

  get history(): KritzelHistory {
    return this._history;
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
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.selected);
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
    this._state.objectsOctree = new KritzelOctree<KritzelBaseObject<any>>({
      x: -Infinity,
      y: -Infinity,
      z: -Infinity,
      width: Infinity,
      height: Infinity,
      depth: Infinity,
    });
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

  deleteObject(id: string, isHistoryUpdated: boolean = true) {
    const object = this.findObjectById(id);
    if (object) {
      if (isHistoryUpdated) {
        const removeObjectCommand = new RemoveObjectCommand(this, this, object);
        this.history.executeCommand(removeObjectCommand);
      } else {
        this._state.objectsOctree.remove(obj => obj.id === id);
        this.rerender();
      }
    }
  }

  copy() {
    this.state.copiedObjects = this.state.selectionGroup.copy() as KritzelSelectionGroup;
  }

  paste(x?: number, y?: number) {
    this.state.copiedObjects.selected = true;

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
    const max = this.allObjects.length + 1;
    const objects = object ? [object] : this.state.selectionGroup.objects;
    const increaseZIndexCommands = objects.map(obj => {
      return new UpdateObjectCommand(this, this, obj, { zIndex: max });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  sendToBack(object?: KritzelBaseObject<any>) {
    const min = -1;
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
      obj.selected = false;
      selectionGroup.addOrRemove(obj);
    });

    selectionGroup.selected = true;

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
        obj.selected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.selected = true;

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
      this.deleteObject(this.state.activeText.id, false);
      this.history.undoStack.pop();
    }

    this.state.activeText = null;
  }

  getObjectFromPointerEvent(event: TouchEvent | MouseEvent, selector = '.object'): KritzelBaseObject<any> | null {
    const shadowRoot = this.state.host?.shadowRoot;
    if (!shadowRoot) return null;

    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      const touch = event.touches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const elementAtPoint = shadowRoot.elementFromPoint(clientX, clientY);
    if (!elementAtPoint) return null;

    const selectedObject = elementAtPoint.closest(selector) as HTMLElement | null;

    if (selectedObject) {
      return this.allObjects.find(object => selectedObject.id === object.id);
    }

    return null;
  }
}
