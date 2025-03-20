import { createStore } from '@stencil/store';
import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { KritzelPath } from '../classes/objects/path.class';
import { KritzelTool } from '../components';
import { KrtizelSelectionBox } from '../classes/objects/selection-box.class';
import { KritzelSelectionGroup } from '../classes/objects/selection-group.class';

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
      selectionBox: null,
      selectionGroup: null,
      isSelecting: false,
      isResizing: false,
      isRotating: false,
      isDragging: false,
      isDrawing: false,
      isErasing: false,
      isCtrlKeyPressed: false,
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
}
