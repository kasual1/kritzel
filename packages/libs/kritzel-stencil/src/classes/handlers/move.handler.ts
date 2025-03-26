import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../../stores/store';
import { KritzelBaseHandler } from './base.handler';

export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

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
    this._store.state.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  private updateDragging(event: MouseEvent): void {
    this._store.state.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this._store.rerender();
  }

  private stopDragging(): void {
    this._store.state.isDragging = false;
  }
}
