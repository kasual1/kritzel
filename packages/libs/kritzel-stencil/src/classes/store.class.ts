import { createStore } from '@stencil/store';
import { KritzelBaseObject } from './objects/base-object.class';
import { KritzelPath } from './objects/path.class';
import { KritzelTool } from '../components';
import { KrtizelSelectionBox } from './objects/selection-box.class';
import { KritzelSelectionGroup } from './objects/selection-group.class';
import { KritzelHandleType } from '../enums/handle-type.enum';
import { RemoveSelectionGroupCommand } from './commands/remove-selection-group.command';
import { KritzelHistory } from './history.class';
export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  copiedObjects?: KritzelSelectionGroup;
  objects: KritzelBaseObject<Element>[];
  selectionBox?: KrtizelSelectionBox;
  selectionGroup?: KritzelSelectionGroup;
  resizeHandleType: KritzelHandleType;
  isSelecting: boolean;
  isResizing: boolean;
  isResizeHandleSelected: boolean;
  isRotating: boolean;
  isRotationHandleSelected: boolean;
  isDragging: boolean;
  isDrawing: boolean;
  isErasing: boolean;
  isCtrlKeyPressed: boolean;
  hasViewportChanged: boolean;
  showDebugInfo: boolean;
  host: HTMLElement;
  cursorX: number;
  cursorY: number;
  scale: number;
  scaleMax: number;
  scaleMin: number;
  scaleStep: number;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
}

export class KritzelStore {
  private readonly _store: any;

  private readonly _history: KritzelHistory;

  get history(): KritzelHistory {
    return this._history;
  }

  get state(): KritzelEngineState {
    return this._store.state;
  }

  get currentZIndex() {
    return this.state.objects.length;
  }

  get selectedObjects() {
    return this.state.objects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.selected);
  }

  get unselctedObjects() {
    return this.state.objects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => !o.selected);
  }

  get objectsWithoutSelectionBox() {
    return this.state.objects.filter(o => !(o instanceof KrtizelSelectionBox));
  }

  get hasSelectionGroup() {
    return this.state.selectionGroup !== null;
  }

  constructor() {
    this._store = createStore<KritzelEngineState>({
      activeTool: null,
      currentPath: null,
      objects: [],
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
      showDebugInfo: true,
      host: null,
      cursorX: 0,
      cursorY: 0,
      scale: 500,
      scaleMax: 1000,
      scaleMin: 0.0001,
      scaleStep: 0.05,
      startX: 0,
      startY: 0,
      translateX: 0,
      translateY: 0,
    });
    this._history = new KritzelHistory(this);
  }

  rerender() {
    this.state.objects = [...this.state.objects];
  }

  findObjectById(id: string): KritzelBaseObject<any> | null {
    for (const object of this.state.objects) {
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
