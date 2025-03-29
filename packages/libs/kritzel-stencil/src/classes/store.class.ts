import { createStore } from '@stencil/store';
import { KritzelBaseObject } from './objects/base-object.class';
import { KritzelPath } from './objects/path.class';
import { KritzelTool } from '../components';
import { KrtizelSelectionBox } from './objects/selection-box.class';
import { KritzelSelectionGroup } from './objects/selection-group.class';
import { KritzelBaseCommand } from './commands/base.command';
import { UpdateViewportCommand } from './commands/update-viewport.command';
import { KritzelHandleType } from '../enums/handle-type.enum';
import { RemoveSelectionGroupCommand } from './commands/remove-selection-group.command';
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
  private readonly store: any;

  undoStack: KritzelBaseCommand[] = [];
  redoStack: KritzelBaseCommand[] = [];

  previousViewport: {
    scale: number;
    scaleStep: number;
    translateX: number;
    translateY: number;
  };

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

  get objectsWithoutSelectionBox() {
    return this.state.objects.filter(o => !(o instanceof KrtizelSelectionBox));
  }

  get hasSelectionGroup() {
    return this.state.selectionGroup !== null;
  }

  constructor() {
    this.store = createStore<KritzelEngineState>({
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
      showDebugInfo: false,
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
    this.previousViewport = {
      scale: this.state.scale,
      scaleStep: this.state.scaleStep,
      translateX: this.state.translateX,
      translateY: this.state.translateY,
    };
  }

  rerender() {
    this.state.objects = [...this.state.objects];
  }

  executeCommand(command: KritzelBaseCommand) {
    if (this.state.hasViewportChanged) {
      const command = new UpdateViewportCommand(this, this, this.previousViewport);
      command.execute();
      this.undoStack.push(command);
      this.redoStack = this.redoStack.length > 0 ? [] : this.redoStack;
      this.state.hasViewportChanged = false;
      this.previousViewport = {
        scale: this.state.scale,
        scaleStep: this.state.scaleStep,
        translateX: this.state.translateX,
        translateY: this.state.translateY,
      };
    }

    command.execute();
    console.log('add', command);
    this.undoStack.push(command);
    this.redoStack = this.redoStack.length > 0 ? [] : this.redoStack;
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      console.log('undo', command);
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      console.log('redo', command);
      this.undoStack.push(command);
    }
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
      this.executeCommand(new RemoveSelectionGroupCommand(this, this));
    }
  }

  updateEntireState(state: KritzelEngineState) {
    for (const key in state) {
      const value = state[key];
      this.store.set(key, value);
    }
  }
}
