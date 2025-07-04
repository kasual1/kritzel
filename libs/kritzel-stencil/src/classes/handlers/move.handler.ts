import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelStore } from '../store.class';
import { MoveSelectionGroupCommand } from '../commands/move-selection-group.command';
import { KritzelBaseHandler } from './base.handler';

export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  startX: number;
  startY: number;

  endX: number;
  endY: number;

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        if (this._store.state.selectionGroup?.selected && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
          const clientX = event.clientX - this._store.offsetX;
          const clientY = event.clientY - this._store.offsetY;

          this._store.state.isDragging = true;
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.startX = this.dragStartX;
          this.startY = this.dragStartY;
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      if (this._store.state.pointers.size === 1) {
        if (this._store.state.selectionGroup?.selected && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
          const x = Math.round(activePointers[0].clientX - this._store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._store.offsetY);

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
      if (this._store.state.isDragging && this._store.state.selectionGroup) {
        const clientX = event.clientX - this._store.offsetX;
        const clientY = event.clientY - this._store.offsetY;

        this.endX = clientX;
        this.endY = clientY;
        this._store.state.selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
        this.dragStartX = clientX;
        this.dragStartY = clientY;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      if (this._store.state.pointers.size === 1 && this._store.state.selectionGroup && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
        const x = Math.round(activePointers[0].clientX - this._store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._store.offsetY);

        this._store.state.isDragging = true;
        this.endX = x;
        this.endY = y;

        const moveDeltaX = Math.abs(x - this.startX);
        const moveDeltaY = Math.abs(y - this.startY);
        const moveThreshold = 5;

        if (moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          clearTimeout(this._store.state.longTouchTimeout);

          this._store.state.selectionGroup.move(x, y, this.dragStartX, this.dragStartY);
          this.dragStartX = x;
          this.dragStartY = y;
        }
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isDragging) {
        this._store.state.isDragging = false;
        this._store.history.executeCommand(new MoveSelectionGroupCommand(this._store, this, this.endX, this.endY, this.startX, this.startY, true));
      }
    }

    if (event.pointerType === 'touch') {
      if (this._store.state.isDragging) {
        this._store.state.isDragging = false;
        this._store.history.executeCommand(new MoveSelectionGroupCommand(this._store, this, this.endX, this.endY, this.startX, this.startY, true));
      }
    }
  }
}
