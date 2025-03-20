import { createStore } from '@stencil/store';
import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelTool } from '../components';
import { KritzelSelectionState } from '../interfaces/selection-state.interface';

export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  objects: KritzelBaseObject<Element>[];
  showDebugInfo: boolean;
  selectionState: KritzelSelectionState;
}

export class KritzelStore {
  store: any;

  kritzelEngineState: KritzelEngineState;

  get state(): KritzelEngineState {
    return this.store.state;
  }

  get currentZIndex() {
    return this.state.objects.length;
  }

  set state(value: KritzelEngineState) {
    this.store.state = value;
  }

  constructor() {
    this.store = createStore<KritzelEngineState>({
      activeTool: undefined,
      currentPath: undefined,
      objects: [],
      showDebugInfo: true,
      selectionState: {
        selectionBox: null,
        selectionGroup: null,
        isSelecting: false,
        isResizing: false,
        isRotating: false,
        isDragging: false,
        isCtrlKeyPressed: false,
      },
    });
  }

  rerender() {
    this.state = { ...this.state };
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
}
