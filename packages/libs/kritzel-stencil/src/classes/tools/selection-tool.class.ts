import { KritzelTool } from '../../components';
import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelStore } from '../../stores/store';
import { KritzelKeyHandler } from '../handlers/key.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';

export class KritzelSelectionTool implements KritzelTool, KritzelSerializable {
  __class__: string = this.constructor.name;

  private static instance: KritzelSelectionTool;

  name: string = 'selection';
  icon: string = 'selection';

  selectionState: KritzelSelectionState = {
    selectionBox: null,
    selectionGroup: null,
    isSelecting: false,
    isResizing: false,
    isRotating: false,
    isDragging: false,
    isCtrlKeyPressed: false,
  };

  selectionHandler: KritzelSelectionHandler;
  resizeHandler: KritzelResizeHandler;
  rotationHandler: KritzelRotationHandler;
  keyHandler: KritzelKeyHandler;

  constructor(store: KritzelStore) {
    if (KritzelSelectionTool.instance) {
      return KritzelSelectionTool.instance;
    }
    KritzelSelectionTool.instance = this;

    this.selectionHandler = new KritzelSelectionHandler(this.selectionState, store);
    this.resizeHandler = new KritzelResizeHandler(this.selectionState, store);
    this.rotationHandler = new KritzelRotationHandler(this.selectionState, store);
    this.keyHandler = new KritzelKeyHandler(this.selectionState, store);

    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  handleKeyDown(event: KeyboardEvent): void {
    this.keyHandler.handleKeyDown(event);
  }

  handleKeyUp(event: KeyboardEvent): void {
    this.keyHandler.handleKeyUp(event);
  }

  handleMouseDown(event: MouseEvent): void {
    this.selectionHandler.handleMouseDown(event);
    this.resizeHandler.handleMouseDown(event);
    this.rotationHandler.handleMouseDown(event);
  }

  handleMouseMove(event: MouseEvent): void {
    this.selectionHandler.handleMouseMove(event);
    this.resizeHandler.handleMouseMove(event);
    this.rotationHandler.handleMouseMove(event);
  }

  handleMouseUp(event: MouseEvent): void {
    this.selectionHandler.handleMouseUp(event);
    this.resizeHandler.handleMouseUp(event);
    this.rotationHandler.handleMouseUp(event);
  }

  handleWheel(_event: WheelEvent): void {
    // Do nothing
  }

  revive(object: any): KritzelSerializable {
    Object.keys(object).forEach(key => {
      if (key in this) {
        (this as any)[key] = object[key];
      }
    });
    return KritzelSelectionTool.instance;
  }
}
