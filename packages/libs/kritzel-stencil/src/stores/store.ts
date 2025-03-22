import { createStore } from '@stencil/store';
import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelTool } from '../components';
import { KrtizelSelectionBox } from '../classes/objects/selection-box.class';
import { KritzelSelectionGroup } from '../classes/objects/selection-group.class';
import { KritzelHistory } from '../classes/history.class';

export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  copiedObject?: KritzelSelectionGroup;
  objects: KritzelBaseObject<Element>[];
  selectionBox?: KrtizelSelectionBox;
  selectionGroup?: KritzelSelectionGroup;
  isSelecting: boolean;
  isResizing: boolean;
  isRotating: boolean;
  isDragging: boolean;
  isDrawing: boolean;
  isErasing: boolean;
  isCtrlKeyPressed: boolean;
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
  store: any;

  history: KritzelHistory;

  get state(): KritzelEngineState {
    return this.store.state;
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

  set state(value: KritzelEngineState) {
    this.store.state = value;
  }

  constructor() {
    this.store = createStore<KritzelEngineState>({
      activeTool: null,
      currentPath: null,
      objects: [],
      selectionBox: null,
      selectionGroup: null,
      isSelecting: false,
      isResizing: false,
      isRotating: false,
      isDragging: false,
      isDrawing: false,
      isErasing: false,
      isCtrlKeyPressed: false,
      showDebugInfo: true,
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
    });
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
    for (const object of this.state.objects) {
      object.selected = false;
    }

    this.rerender();
  }

  updateEntireState(state: KritzelEngineState) {
    for (const key in state) {
      const value = state[key];
      this.store.set(key, value);
    }
  }
}
