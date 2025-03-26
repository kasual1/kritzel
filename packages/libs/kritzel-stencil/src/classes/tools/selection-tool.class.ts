import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../../stores/store';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { KritzelKeyHandler } from '../handlers/key.handler';
import { KritzelMoveHandler } from '../handlers/move.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelSelectionTool extends KritzelBaseTool {
  name: string = 'selection';
  icon: string = 'selection';

  selectionHandler: KritzelSelectionHandler;
  moveHandler: KritzelMoveHandler;
  resizeHandler: KritzelResizeHandler;
  rotationHandler: KritzelRotationHandler;
  keyHandler: KritzelKeyHandler;

  constructor(store: KritzelStore) {
    super(store);
    this.selectionHandler = new KritzelSelectionHandler(this._store);
    this.moveHandler = new KritzelMoveHandler(this._store);
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
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isResizeHandleSelected = this.isHandleSelected(event);
      this._store.state.isRotationHandleSelected = this.isRotationHandleSelected(event);
      this._store.state.resizeHandleType = this.getHandleType(event);

      const selectedObject = this.getSelectedObject(event);

      if (selectedObject === null && this._store.state.selectionGroup && this._store.state.isResizeHandleSelected === false && this._store.state.isRotationHandleSelected === false) {
        this._store.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
      }
    }

    this.selectionHandler.handleMouseDown(event);
    this.moveHandler.handleMouseDown(event);
    this.resizeHandler.handleMouseDown(event);
    this.rotationHandler.handleMouseDown(event);
  }

  handleMouseMove(event: MouseEvent): void {
    this.selectionHandler.handleMouseMove(event);
    this.moveHandler.handleMouseMove(event);
    this.resizeHandler.handleMouseMove(event);
    this.rotationHandler.handleMouseMove(event);
  }

  handleMouseUp(event: MouseEvent): void {
    this.selectionHandler.handleMouseUp(event);
    this.moveHandler.handleMouseUp(event);
    this.resizeHandler.handleMouseUp(event);
    this.rotationHandler.handleMouseUp(event);
  }

  private getSelectedObject(event: MouseEvent): KritzelSelectionGroup | null {
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._store.findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = new KritzelSelectionGroup(this._store);
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
  }

  private getHandleType(event: MouseEvent): KritzelHandleType {
    const path = event.composedPath() as HTMLElement[];
    const handle = path.find(element => element.classList && element.classList.contains('selection-handle'));
    return handle?.classList[1] as KritzelHandleType;
  }

  private isHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('selection-handle'));
  }

  private isRotationHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('rotation-handle'));
  }
}
