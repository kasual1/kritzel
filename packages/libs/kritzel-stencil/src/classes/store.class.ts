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
import { KritzelToolRegistry } from './tool.registry';

const initialState: KritzelEngineState = {
  activeTool: null,
  activeText: null,
  currentPath: null,
  copiedObjects: null,
  objectsOctree: null,
  selectionBox: null,
  selectionGroup: null,
  resizeHandleType: null,
  isEnabled: true,
  isScaling: false,
  isPanning: false,
  isFocused: false,
  isSelecting: false,
  isResizing: false,
  isResizeHandleSelected: false,
  isRotating: false,
  isRotationHandleSelected: false,
  isDragging: false,
  isDrawing: false,
  isErasing: false,
  isWriting: false,
  isCtrlKeyPressed: false,
  hasViewportChanged: false,
  skipContextMenu: false,
  debugInfo: {
    showObjectInfo: false,
    showViewportInfo: true,
    logCommands: false,
  },
  host: null,
  cursorX: 0,
  cursorY: 0,
  scale: 1,
  scaleMax: 1000,
  scaleMin: 0.0001,
  scaleStep: 0.05,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0,
  viewportWidth: 0,
  viewportHeight: 0,
  historyBufferSize: 1000,
  touchCount: 0,
};
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
    this._state = initialState;
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

  clearSelection() {
    this.history.executeCommand(new RemoveSelectionGroupCommand(this, this.state.selectionGroup));
  }

  delete() {
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

    this.state.copiedObjects = this.state.selectionGroup.copy() as KritzelSelectionGroup;
    this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
  }

  moveUp() {
    const max = this.allObjects.length + 1;
    const increaseZIndexCommands = this.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === max) {
        return;
      }

      return new UpdateObjectCommand(this, this, obj, { zIndex: obj.zIndex + 1 });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  moveDown() {
    const min = 0;
    const decreaseZIndexCommands = this.state.selectionGroup.objects.map(obj => {
      if (obj.zIndex === min) {
        return;
      }

      return new UpdateObjectCommand(this, this, obj, { zIndex: obj.zIndex - 1 });
    });

    this.history.executeCommand(new BatchCommand(this, this, decreaseZIndexCommands));
  }

  moveToTop() {
    const max = this.allObjects.length + 1;
    const increaseZIndexCommands = this.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this, this, obj, { zIndex: max });
    });

    this.history.executeCommand(new BatchCommand(this, this, increaseZIndexCommands));
  }

  moveToBottom() {
    const min = -1;
    const decreaseZIndexCommands = this.state.selectionGroup.objects.map(obj => {
      return new UpdateObjectCommand(this, this, obj, { zIndex: min });
    });

    this.history.executeCommand(new BatchCommand(this, this, decreaseZIndexCommands));
  }

  selectAllInViewport() {
    const objectsInViewport = this._state.objectsOctree.query({
      x: -this._state.translateX / this._state.scale,
      y: -this._state.translateY / this._state.scale,
      z: this._state.scale,
      width: this._state.viewportWidth / this._state.scale,
      height: this._state.viewportHeight / this._state.scale,
      depth: 100,
    });

    if (objectsInViewport.length > 0) {
      const selectionGroup = new KritzelSelectionGroup(this);

      objectsInViewport.forEach(obj => {
        obj.selected = false;
        selectionGroup.addOrRemove(obj);
      });

      selectionGroup.selected = true;

      this.history.executeCommand(new AddSelectionGroupCommand(this, this, selectionGroup));
      this.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    }
  }

  resetActiveText() {
    if (this.state.activeText && this.state.activeText.value === '') {
      this.deleteObject(this.state.activeText.id, false);
      this.history.undoStack.pop();
    }

    this.state.activeText = null;
  }
}
