import { KritzelClickHelper } from '../../helpers/click.helper';
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

  handleMouseDown(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
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

  handleMouseMove(event: MouseEvent) {
    if (this._store.state.isDragging && this._store.state.selectionGroup) {
      const clientX = event.clientX - this._store.offsetX;
      const clientY = event.clientY - this._store.offsetY;

      this.endX = clientX;
      this.endY = clientY;
      this._store.state.selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
      this.dragStartX = clientX;
      this.dragStartY = clientY;

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent) {
    if (this._store.state.isDragging) {
      this._store.state.isDragging = false;
      this._store.history.executeCommand(new MoveSelectionGroupCommand(this._store, this, this.endX, this.endY, this.startX, this.startY, true));
    }
  }

  handleTouchStart(event: TouchEvent) {
    if (this._store.state.touchCount === 1) {
      if (this._store.state.selectionGroup?.selected && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
        const x = Math.round(event.touches[0].clientX - this._store.offsetX);
        const y = Math.round(event.touches[0].clientY - this._store.offsetY);

        this._store.state.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.startX = x;
        this.startY = y;
      }
    }
  }

  handleTouchMove(event: TouchEvent) {
    if (this._store.state.touchCount === 1 && this._store.state.selectionGroup && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);

      this.endX = x;
      this.endY = y;
      this._store.state.selectionGroup.move(x, y, this.dragStartX, this.dragStartY);
      this.dragStartX = x;
      this.dragStartY = y;
    }
  }

  handleTouchEnd(_event: TouchEvent) {
    if (this._store.state.isDragging) {
      this._store.state.isDragging = false;
      this._store.history.executeCommand(new MoveSelectionGroupCommand(this._store, this, this.endX, this.endY, this.startX, this.startY, true));
    }
  }
}
