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

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event)) {
      if (this._store.state.selectionGroup?.selected && !this._store.state.isResizeHandleSelected && !this._store.state.isRotationHandleSelected) {
        this.startDragging(event);
      }
    }
  }

  handleMouseMove(event) {
    if (this._store.state.isDragging && this._store.state.selectionGroup) {
      this.updateDragging(event);
    }
  }

  handleMouseUp(_event) {
    if (this._store.state.isDragging) {
      this.stopDragging();
    }
  }

  private startDragging(event: MouseEvent): void {
    const clientX = event.clientX - this._store.offsetX;
    const clientY = event.clientY - this._store.offsetY;

    this._store.state.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.startX = this.dragStartX;
    this.startY = this.dragStartY;
  }

  private updateDragging(event: MouseEvent): void {
    const clientX = event.clientX - this._store.offsetX;
    const clientY = event.clientY - this._store.offsetY;

    this.endX = clientX;
    this.endY = clientY;
    this._store.state.selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
    this.dragStartX = clientX;
    this.dragStartY = clientY;

    this._store.rerender();
  }

  private stopDragging(): void {
    this._store.state.isDragging = false;
    this._store.history.executeCommand(new MoveSelectionGroupCommand(this._store, this, this.endX, this.endY, this.startX, this.startY, true));
  }
}
