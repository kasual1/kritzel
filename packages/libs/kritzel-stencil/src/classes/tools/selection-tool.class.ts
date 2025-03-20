import { KritzelStore } from '../../stores/store';
import { KritzelKeyHandler } from '../handlers/key.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelSelectionTool extends KritzelBaseTool {
  name: string = 'selection';
  icon: string = 'selection';

  selectionHandler: KritzelSelectionHandler;
  resizeHandler: KritzelResizeHandler;
  rotationHandler: KritzelRotationHandler;
  keyHandler: KritzelKeyHandler;

  constructor(store: KritzelStore) {
    super(store);
    this.selectionHandler = new KritzelSelectionHandler(this._store);
    this.resizeHandler = new KritzelResizeHandler(this._store);
    this.rotationHandler = new KritzelRotationHandler(this._store);
    this.keyHandler = new KritzelKeyHandler(this._store);

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
}
