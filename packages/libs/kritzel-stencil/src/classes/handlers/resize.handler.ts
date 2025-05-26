import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelMouseHelper } from '../../helpers/click.helper';
import { ResizeSelectionGroupCommand } from '../commands/resize-selection-group.command';
import { KritzelStore } from '../store.class';
import { KritzelBaseHandler } from './base.handler';
import { cloneDeep } from 'lodash-es';

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;

  initialSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  newSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelMouseHelper.isLeftClick(event)) {
      if (this._store.state.selectionGroup && this._store.state.isResizeHandleSelected) {
        const clientX = event.clientX - this._store.offsetX;
        const clientY = event.clientY - this._store.offsetY;

        this._store.state.isResizing = true;
        this.initialMouseX = clientX;
        this.initialMouseY = clientY;
        this.initialSize.width = this._store.state.selectionGroup.width;
        this.initialSize.height = this._store.state.selectionGroup.height;
        this.initialSize.x = this._store.state.selectionGroup.translateX;
        this.initialSize.y = this._store.state.selectionGroup.translateY;
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isResizing && this._store.state.selectionGroup) {
      const clientX = event.clientX - this._store.offsetX;
      const clientY = event.clientY - this._store.offsetY;

      const dx = clientX - this.initialMouseX;
      const dy = clientY - this.initialMouseY;

      switch (this._store.state.resizeHandleType) {
        case KritzelHandleType.TopLeft:
          this.newSize.width = this.initialSize.width - dx;
          this.newSize.height = this.initialSize.height - dy;
          this.newSize.x = dx / this._store.state.scale + this.initialSize.x;
          this.newSize.y = dy / this._store.state.scale + this.initialSize.y;
          break;
        case KritzelHandleType.TopRight:
          this.newSize.width = this.initialSize.width + dx;
          this.newSize.height = this.initialSize.height - dy;
          this.newSize.x = this.initialSize.x;
          this.newSize.y = dy / this._store.state.scale + this.initialSize.y;
          break;
        case KritzelHandleType.BottomLeft:
          this.newSize.width = this.initialSize.width - dx;
          this.newSize.height = this.initialSize.height + dy;
          this.newSize.x = dx / this._store.state.scale + this.initialSize.x;
          this.newSize.y = this.initialSize.y;
          break;
        case KritzelHandleType.BottomRight:
          this.newSize.width = this.initialSize.width + dx;
          this.newSize.height = this.initialSize.height + dy;
          this.newSize.x = this.initialSize.x;
          this.newSize.y = this.initialSize.y;
          break;
      }

      this._store.state.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isResizing) {
      const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._store, this, cloneDeep(this.initialSize), cloneDeep(this.newSize));
      this._store.history.executeCommand(resizeSelectionGroupCommand);
      this._store.state.isResizing = false;
      this._store.rerender();
    }
  }

  handleTouchStart(event: TouchEvent): void {
    const firstTouch = event.touches[0];

    if (!firstTouch) {
      return;
    }

    if (this._store.state.touchCount === 1) {
      if (this._store.state.selectionGroup && this._store.state.isResizeHandleSelected) {
        const clientX = Math.round(firstTouch.clientX - this._store.offsetX);
        const clientY = Math.round(firstTouch.clientY - this._store.offsetY);

        this._store.state.isResizing = true;
        this.initialMouseX = clientX;
        this.initialMouseY = clientY;
        this.initialSize.width = this._store.state.selectionGroup.width;
        this.initialSize.height = this._store.state.selectionGroup.height;
        this.initialSize.x = this._store.state.selectionGroup.translateX;
        this.initialSize.y = this._store.state.selectionGroup.translateY;

        clearTimeout(this._store.state.longTouchTimeout);
      }
    }
  }

  handleTouchMove(event: TouchEvent): void {
    const oneFingerTouch = event.touches[0];

    if (!oneFingerTouch) {
      return;
    }

    if (this._store.state.isResizing && this._store.state.selectionGroup) {
      const clientX = Math.round(oneFingerTouch.clientX - this._store.offsetX);
      const clientY = Math.round(oneFingerTouch.clientY - this._store.offsetY);

      const dx = clientX - this.initialMouseX;
      const dy = clientY - this.initialMouseY;

      switch (this._store.state.resizeHandleType) {
        case KritzelHandleType.TopLeft:
          this.newSize.width = this.initialSize.width - dx;
          this.newSize.height = this.initialSize.height - dy;
          this.newSize.x = dx / this._store.state.scale + this.initialSize.x;
          this.newSize.y = dy / this._store.state.scale + this.initialSize.y;
          break;
        case KritzelHandleType.TopRight:
          this.newSize.width = this.initialSize.width + dx;
          this.newSize.height = this.initialSize.height - dy;
          this.newSize.x = this.initialSize.x;
          this.newSize.y = dy / this._store.state.scale + this.initialSize.y;
          break;
        case KritzelHandleType.BottomLeft:
          this.newSize.width = this.initialSize.width - dx;
          this.newSize.height = this.initialSize.height + dy;
          this.newSize.x = dx / this._store.state.scale + this.initialSize.x;
          this.newSize.y = this.initialSize.y;
          break;
        case KritzelHandleType.BottomRight:
          this.newSize.width = this.initialSize.width + dx;
          this.newSize.height = this.initialSize.height + dy;
          this.newSize.x = this.initialSize.x;
          this.newSize.y = this.initialSize.y;
          break;
      }

      this._store.state.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);

      clearTimeout(this._store.state.longTouchTimeout);
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
    if (this._store.state.isResizing) {
      const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._store, this, cloneDeep(this.initialSize), cloneDeep(this.newSize));
      this._store.history.executeCommand(resizeSelectionGroupCommand);
      this._store.state.isResizing = false;

      clearTimeout(this._store.state.longTouchTimeout);
    }
  }
}
