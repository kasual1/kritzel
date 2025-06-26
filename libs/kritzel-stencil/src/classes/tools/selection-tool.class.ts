import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelStore } from '../store.class';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { KritzelMoveHandler } from '../handlers/move.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelText } from '../objects/text.class';
import { KritzelToolRegistry } from '../registries/tool.registry';

export class KritzelSelectionTool extends KritzelBaseTool {
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
    if (KritzelEventHelper.isLeftClick(event)) {
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
        this._store.history.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
      }
    }

    this.moveHandler.handleMouseDown(event);
    this.selectionHandler.handleMouseDown(event);
    this.resizeHandler.handleMouseDown(event);
    this.rotationHandler.handleMouseDown(event);

    this._store.rerender();
  }

  handleMouseMove(event: MouseEvent): void {
    this.moveHandler.handleMouseMove(event);
    this.selectionHandler.handleMouseMove(event);
    this.resizeHandler.handleMouseMove(event);
    this.rotationHandler.handleMouseMove(event);

    this._store.rerender();
  }

  handleMouseUp(event: MouseEvent): void {
    this.moveHandler.handleMouseUp(event);
    this.selectionHandler.handleMouseUp(event);
    this.resizeHandler.handleMouseUp(event);
    this.rotationHandler.handleMouseUp(event);

    this._store.rerender();
  }

  handleDoubleClick(event: MouseEvent): void {
    if (KritzelEventHelper.isLeftClick(event)) {
      if (this._store.state.selectionGroup && this._store.state.selectionGroup?.objects.length === 1) {
        const selectedObject = this._store.state.selectionGroup.objects[0];

        if (selectedObject instanceof KritzelText) {
          this._store.history.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
          this._store.setState('activeTool', KritzelToolRegistry.getTool('text'));
          this._store.state.activeText = selectedObject;

          setTimeout(() => {
            selectedObject.focus();
          }, 300);
        }
      }
    }
  }

  handleDoubleTap(event: TouchEvent): void {
    const selectionGroup = this.getSelectedObject(event);
    
    if (!selectionGroup || selectionGroup.objects.length !== 1) {
      return;
    }

    const selectedObject = selectionGroup.objects[0];

    if (selectedObject instanceof KritzelText) {
      this._store.setState('activeTool', KritzelToolRegistry.getTool('text'));
      this._store.state.activeText = selectedObject;

      setTimeout(() => {
        selectedObject.focus();
      }, 300);
    }
  }

  handleTouchStart(event: TouchEvent): void {
    if (this._store.state.isScaling === true) {
      return;
    }

    if (this._store.state.touchCount === 1) {
      this._store.state.isResizeHandleSelected = this.isHandleSelected(event);
      this._store.state.isRotationHandleSelected = this.isRotationHandleSelected(event);
      this._store.state.resizeHandleType = this.getHandleType(event);

      const selectedObject = this.getSelectedObject(event);
      const isDifferentObject = selectedObject && this._store.state.selectionGroup && selectedObject.id !== this._store.state.selectionGroup.id;

      if (!this._store.state.selectionGroup && selectedObject) {
        this._store.state.skipContextMenu = true;
      }

      if (
        (selectedObject === null || isDifferentObject) &&
        this._store.state.selectionGroup &&
        !this._store.state.isResizeHandleSelected &&
        !this._store.state.isRotationHandleSelected
      ) {
        this._store.history.executeCommand(new RemoveSelectionGroupCommand(this._store, this._store.state.selectionGroup));
      }
    }

    this.rotationHandler.handleTouchStart(event);
    this.resizeHandler.handleTouchStart(event);
    this.moveHandler.handleTouchStart(event);
    this.selectionHandler.handleTouchStart(event);
  }

  handleTouchMove(event: TouchEvent): void {
    if (this._store.state.isScaling === true) {
      return;
    }

    this.rotationHandler.handleTouchMove(event);
    this.resizeHandler.handleTouchMove(event);
    this.moveHandler.handleTouchMove(event);
    this.selectionHandler.handleTouchMove(event);

    this._store.rerender();
  }

  handleTouchEnd(event: TouchEvent): void {
    if (this._store.state.isScaling === true) {
      return;
    }

    this.rotationHandler.handleTouchEnd(event);
    this.resizeHandler.handleTouchEnd(event);
    this.moveHandler.handleTouchEnd(event);
    this.selectionHandler.handleTouchEnd(event);
  }

  private getSelectedObject(event: MouseEvent | TouchEvent): KritzelSelectionGroup | null {
    
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._store.findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = KritzelSelectionGroup.create(this._store);
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
  }

  private getHandleType(event: MouseEvent | TouchEvent): KritzelHandleType {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const point = event instanceof TouchEvent ? event.touches[0] : event;
    const elementAtPoint = shadowRoot.elementFromPoint(point.clientX, point.clientY);

    const handle = elementAtPoint.closest('.resize-handle-overlay') as HTMLElement | null;

    return handle?.classList[1] as KritzelHandleType;
  }

  private isHandleSelected(event: MouseEvent | TouchEvent): boolean {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const point = event instanceof TouchEvent ? event.touches[0] : event;
    const elementAtPoint = shadowRoot.elementFromPoint(point.clientX, point.clientY);

    return elementAtPoint?.classList.contains('resize-handle-overlay');
  }

  private isRotationHandleSelected(event: MouseEvent | TouchEvent): boolean {
    const path = event.composedPath() as HTMLElement[];

    return !!path.find(element => element.classList && element.classList.contains('rotation-handle-overlay'));
  }
}
