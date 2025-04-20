import { KritzelBaseObject } from './objects/base-object.class';
import { KritzelSelectionGroup } from './objects/selection-group.class';
import { RemoveSelectionGroupCommand } from './commands/remove-selection-group.command';
import { KritzelHistory } from './history.class';
import { KritzelEngineState } from '../interfaces/engine-state.interface';
import { KritzelOctree } from './structures/octree.structure';
import { KritzelBoundingBox } from '../interfaces/bounding-box.interface';
import { KrtizelSelectionBox } from './objects/selection-box.class';
import { KritzelEngine } from '../components/kritzel-engine/kritzel-engine';

const initialState: KritzelEngineState = {
  activeTool: null,
  currentPath: null,
  objectsOctree: null,
  selectionBox: null,
  selectionGroup: null,
  resizeHandleType: null,
  isFocused: false,
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
    showViewportInfo: false,
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
  touchCount: 0
};
export class KritzelStore {

  private _kritzelEngine: KritzelEngine;

  private _state: KritzelEngineState;

  private readonly _history: KritzelHistory;

  objectsInViewport: KritzelBaseObject<any>[] = [];

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

    this.objectsInViewport = this._state.objectsOctree.query(viewportBounds);
    
    if(this._kritzelEngine){
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

}
