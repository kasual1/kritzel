import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { RemoveSelectionGroupCommand } from '../commands/remove-selection-group.command';
import { KritzelMoveHandler } from '../handlers/move.handler';
import { KritzelResizeHandler } from '../handlers/resize.handler';
import { KritzelRotationHandler } from '../handlers/rotation.handler';
import { KritzelSelectionHandler } from '../handlers/selection.handler';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelHoverHandler } from '../handlers/hover.handler';
import { KritzelCore } from '../core/core.class';

export class KritzelSelectionTool extends KritzelBaseTool {
  selectionHandler: KritzelSelectionHandler;
  moveHandler: KritzelMoveHandler;
  hoverHandler: KritzelHoverHandler;
  resizeHandler: KritzelResizeHandler;
  rotationHandler: KritzelRotationHandler;

  constructor(core: KritzelCore) {
    super(core);
    this.selectionHandler = new KritzelSelectionHandler(this._core);
    this.moveHandler = new KritzelMoveHandler(this._core);
    this.hoverHandler = new KritzelHoverHandler(this._core);
    this.resizeHandler = new KritzelResizeHandler(this._core);
    this.rotationHandler = new KritzelRotationHandler(this._core);
  }

  handlePointerDown(event: PointerEvent): void {
     if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {

        this._core.store.setState('isResizeHandleSelected', this.isHandleSelected(event));
        this._core.store.setState('isRotationHandleSelected', this.isRotationHandleSelected(event));
        this._core.store.setState('resizeHandleType', this.getHandleType(event));

        const selectedObject = this.getSelectedObject(event);
        const isDifferentObject = selectedObject && this._core.store.state.selectionGroup && selectedObject.id !== this._core.store.state.selectionGroup.id;

        if (
          (selectedObject === null || isDifferentObject) &&
          this._core.store.state.selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected
        ) {
          this._core.history.executeCommand(new RemoveSelectionGroupCommand(this._core, this._core.store.state.selectionGroup));
        }

        if(selectedObject && selectedObject.isSelected === false && selectedObject?.objects.length === 1 && selectedObject.objects[0].isInteractive) {
          return;
        }
      }

      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.rotationHandler.handlePointerDown(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      if (this._core.store.state.pointers.size === 1) {
        this._core.store.setState('isResizeHandleSelected', this.isHandleSelected(event));
        this._core.store.setState('isRotationHandleSelected', this.isRotationHandleSelected(event));
        this._core.store.setState('resizeHandleType', this.getHandleType(event));

        const selectedObject = this.getSelectedObject(event);
        const isDifferentObject = selectedObject && this._core.store.state.selectionGroup && selectedObject.id !== this._core.store.state.selectionGroup.id;

        if (!this._core.store.state.selectionGroup && selectedObject) {
          this._core.store.setState('skipContextMenu', true);
        }

        if (
          (selectedObject === null || isDifferentObject) &&
          this._core.store.state.selectionGroup &&
          !this._core.store.state.isResizeHandleSelected &&
          !this._core.store.state.isRotationHandleSelected
        ) {
          this._core.history.executeCommand(new RemoveSelectionGroupCommand(this._core, this._core.store.state.selectionGroup));
        }

      }

      this.rotationHandler.handlePointerDown(event);
      this.resizeHandler.handlePointerDown(event);
      this.moveHandler.handlePointerDown(event);
      this.selectionHandler.handlePointerDown(event);

      this._core.rerender();
    }
  }

  handlePointerMove(event: PointerEvent): void {
     if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      this.moveHandler.handlePointerMove(event);
      this.hoverHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.rotationHandler.handlePointerMove(event);

      this._core.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      this.rotationHandler.handlePointerMove(event);
      this.resizeHandler.handlePointerMove(event);
      this.moveHandler.handlePointerMove(event);
      this.selectionHandler.handlePointerMove(event);

      this._core.rerender();
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

      this._core.rerender();
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isScaling === true) {
        return;
      }

      this.rotationHandler.handlePointerUp(event);
      this.resizeHandler.handlePointerUp(event);
      this.moveHandler.handlePointerUp(event);
      this.selectionHandler.handlePointerUp(event);

      this._core.rerender();
    }
  }

  private getSelectedObject(event: PointerEvent): KritzelSelectionGroup | null {
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._core.findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = KritzelSelectionGroup.create(this._core);
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
  }

  private getHandleType(event: PointerEvent): KritzelHandleType | undefined {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return;

    const elementAtPoint = shadowRoot.elementFromPoint(event.clientX, event.clientY);

    const handle = elementAtPoint?.closest('.resize-handle-overlay') as HTMLElement | null;

    return handle?.classList[1] as KritzelHandleType;
  }

  private isHandleSelected(event: PointerEvent): boolean {
    const shadowRoot = this._core.store.state.host?.shadowRoot;
    if (!shadowRoot) return false;

    const elementAtPoint = shadowRoot.elementFromPoint(event.clientX, event.clientY);

    return !!elementAtPoint?.classList.contains('resize-handle-overlay');
  }

  private isRotationHandleSelected(event: PointerEvent): boolean {
    const path = event.composedPath() as HTMLElement[];

    return !!path.find(element => element.classList && element.classList.contains('rotation-handle-overlay'));
  }
}
