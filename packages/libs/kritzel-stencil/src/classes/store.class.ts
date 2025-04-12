import { createStore } from '@stencil/store';
import { KritzelBaseObject } from './objects/base-object.class';
import { KritzelSelectionGroup } from './objects/selection-group.class';
import { RemoveSelectionGroupCommand } from './commands/remove-selection-group.command';
import { KritzelHistory } from './history.class';
import { KritzelEngineState } from '../interfaces/engine-state.interface';
import { KritzelOctree } from './structures/octree.structure';
import { KritzelBoundingBox } from '../interfaces/bounding-box.interface';
import { KrtizelSelectionBox } from './objects/selection-box.class';

const initialState: KritzelEngineState = {
  activeTool: null,
  currentPath: null,
  objectsOctree: null,
  selectionBox: null,
  selectionGroup: null,
  resizeHandleType: null,
  isSelecting: false,
  isResizing: false,
  isResizeHandleSelected: false,
  isRotating: false,
  isRotationHandleSelected: false,
  isDragging: false,
  isDrawing: false,
  isErasing: false,
  isCtrlKeyPressed: false,
  hasViewportChanged: false,
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
};
export class KritzelStore {
  private readonly _store: any;

  private readonly _history: KritzelHistory;

  objectsInViewport: KritzelBaseObject<any>[] = [];

  get history(): KritzelHistory {
    return this._history;
  }

  get state(): KritzelEngineState {
    return this._store.state;
  }

  get currentZIndex() {
    return this.state.objectsOctree.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox)).length;
  }

  get allObjects() {
    return this.state.objectsOctree.allObjects();
  }

  get selectedObjects() {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.selected);
  }

  constructor() {
    console.log('KritzelStore constructor');
    this._store = createStore<KritzelEngineState>(initialState);
    this._history = new KritzelHistory(this);
    this._store.state.objectsOctree = new KritzelOctree<KritzelBaseObject<any>>({
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
      x: -this.state.translateX / this.state.scale,
      y: -this.state.translateY / this.state.scale,
      z: this.state.scale,
      width: this.state.viewportWidth / this.state.scale,
      height: this.state.viewportHeight / this.state.scale,
      depth: 100,
    };

    this.objectsInViewport = this.state.objectsOctree.query(viewportBounds);
    this.state.cursorX++;
    this.state.cursorX--;
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
    if (this.state.selectionGroup) {
      this._history.executeCommand(new RemoveSelectionGroupCommand(this, this));
    }
  }

  updateEntireState(state: KritzelEngineState) {
    for (const key in state) {
      const value = state[key];
      this._store.set(key, value);
    }
  }
}
