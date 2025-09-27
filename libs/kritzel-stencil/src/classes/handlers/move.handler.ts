import { KritzelEventHelper } from '../../helpers/event.helper';
import { MoveSelectionGroupCommand } from '../commands/move-selection-group.command';
import { KritzelBaseHandler } from './base.handler';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { BatchCommand } from '../commands/batch.command';
import { KritzelCore } from '../core/core.class';

export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  startX: number;
  startY: number;

  endX: number;
  endY: number;

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        if (this._core.store.state.selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.setState('isDragging', true);
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.startX = this.dragStartX;
          this.startY = this.dragStartY;
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.pointers.size === 1) {
        if (this._core.store.state.selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

          this.dragStartX = x;
          this.dragStartY = y;
          this.startX = x;
          this.startY = y;
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging && this._core.store.state.selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        this.endX = clientX;
        this.endY = clientY;
        this._core.store.state.selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
        this.dragStartX = clientX;
        this.dragStartY = clientY;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.pointers.size === 1 && this._core.store.state.selectionGroup && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.store.setState('isDragging', true);
        this.endX = x;
        this.endY = y;

        const moveDeltaX = Math.abs(x - this.startX);
        const moveDeltaY = Math.abs(y - this.startY);
        const moveThreshold = 5;

        if (moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          clearTimeout(this._core.store.state.longTouchTimeout);

          this._core.store.state.selectionGroup.move(x, y, this.dragStartX, this.dragStartY);
          this.dragStartX = x;
          this.dragStartY = y;
        }
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging) {
        this._core.store.setState('isDragging', false);
        const moveSelectionGroupCommand = new MoveSelectionGroupCommand(this._core, this, this.endX, this.endY, this.startX, this.startY, true);
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          return new UpdateObjectCommand(this._core, this, object, {
            translateX: object.translateX,
            translateY: object.translateY
          });
        });

        this._core.history.executeCommand(new BatchCommand(this._core, this, [moveSelectionGroupCommand, ...updateObjectsCommand]));
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDragging) {
        this._core.store.setState('isDragging', false);
        const moveSelectionGroupCommand = new MoveSelectionGroupCommand(this._core, this, this.endX, this.endY, this.startX, this.startY, true);
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          return new UpdateObjectCommand(this._core, this, object, {
            translateX: object.translateX,
            translateY: object.translateY
          });
        });

        this._core.history.executeCommand(new BatchCommand(this._core, this, [moveSelectionGroupCommand, ...updateObjectsCommand]));
      }
    }
  }
}
