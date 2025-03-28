import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../../stores/store';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
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

  constructor(store: KritzelStore) {
    super(store);
    this.selectionHandler = new KritzelSelectionHandler(this._store);
    this.moveHandler = new KritzelMoveHandler(this._store);
    this.resizeHandler = new KritzelResizeHandler(this._store);
    this.rotationHandler = new KritzelRotationHandler(this._store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isResizeHandleSelected = this.isHandleSelected(event);
      this._store.state.isRotationHandleSelected = this.isRotationHandleSelected(event);
      this._store.state.resizeHandleType = this.getHandleType(event);

      const selectedObject = this.getSelectedObject(event);
      const isDifferentObject = selectedObject && this._store.state.selectionGroup && selectedObject.id !== this._store.state.selectionGroup.id;

      if (
        (selectedObject === null || isDifferentObject) &&
        this._store.state.selectionGroup &&
        !this._store.state.isResizeHandleSelected &&
        !this._store.state.isRotationHandleSelected
      ) {
        this._store.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
      }
    }

    this.moveHandler.handleMouseDown(event);
    this.selectionHandler.handleMouseDown(event);
    this.resizeHandler.handleMouseDown(event);
    this.rotationHandler.handleMouseDown(event);
  }

  handleMouseMove(event: MouseEvent): void {
    this.moveHandler.handleMouseMove(event);
    this.selectionHandler.handleMouseMove(event);
    this.resizeHandler.handleMouseMove(event);
    this.rotationHandler.handleMouseMove(event);
  }

  handleMouseUp(event: MouseEvent): void {
    this.moveHandler.handleMouseUp(event);
    this.selectionHandler.handleMouseUp(event);
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
