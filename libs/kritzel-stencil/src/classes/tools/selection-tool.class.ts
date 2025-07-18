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

  handlePointerDown(event: PointerEvent): void {
     if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
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

        if (selectedObject && selectedObject.selected && selectedObject.objects.length === 1) {
          setTimeout(() => {
            if (this._store.state.isDragging === false && this._store.state.isResizing === false && this._store.state.isRotating === false) {
              selectedObject.objects[0].onSelectedClick();
            }
          }, 100);
        }
      }

      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);

      this._store.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._store.state.isScaling === true) {
        return;
      }

      if (this._store.state.pointers.size === 1) {
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

        if (selectedObject && selectedObject.selected && selectedObject.objects.length === 1) {
          setTimeout(() => {
            if (this._store.state.isDragging === false && this._store.state.isResizing === false && this._store.state.isRotating === false) {
              selectedObject.objects[0].onSelectedClick();
            }
          }, 100);
        }
      }

      this.rotationHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);
    }
  }

  handlePointerMove(event: PointerEvent): void {
     if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this.moveHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.rotationHandler.handlePointerMove(event);

      this._store.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._store.state.isScaling === true) {
        return;
      }

      this.rotationHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.moveHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);

      this._store.rerender();
    }
  }

  handlePointerUp(event: PointerEvent): void {
     if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this.moveHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.rotationHandler.handlePointerUp(event);

      this._store.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._store.state.isScaling === true) {
        return;
      }

      this.rotationHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.moveHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);
    }
  }

  private getSelectedObject(event: PointerEvent): KritzelSelectionGroup | null {
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

  private getHandleType(event: PointerEvent): KritzelHandleType | undefined {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementAtPoint = shadowRoot.elementFromPoint(event.clientX, event.clientY);

    const handle = elementAtPoint?.closest('.resize-handle-overlay') as HTMLElement | null;

    return handle?.classList[1] as KritzelHandleType;
  }

  private isHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementAtPoint = shadowRoot.elementFromPoint(event.clientX, event.clientY);

    return !!elementAtPoint?.classList.contains('resize-handle-overlay');
  }

  private isRotationHandleSelected(event: PointerEvent): boolean {
    const path = event.composedPath() as HTMLElement[];

    return !!path.find(element => element.classList && element.classList.contains('rotation-handle-overlay'));
  }
}
