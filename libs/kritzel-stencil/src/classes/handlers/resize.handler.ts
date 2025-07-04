import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { ResizeSelectionGroupCommand } from '../commands/resize-selection-group.command';
import { KritzelStore } from '../store.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;

  initialSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  newSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
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

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      if (activePointers.length === 1) {
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
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
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

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());
      const oneFingerTouch = activePointers[0];

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
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isResizing) {
        const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._store, this, structuredClone(this.initialSize), structuredClone(this.newSize));
        this._store.history.executeCommand(resizeSelectionGroupCommand);
        this._store.state.isResizing = false;
        this._store.rerender();
      }
    }

    if( event.pointerType === 'touch') {
      if (this._store.state.isResizing) {
        const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._store, this, structuredClone(this.initialSize), structuredClone(this.newSize));
        this._store.history.executeCommand(resizeSelectionGroupCommand);
        this._store.state.isResizing = false;
        this._store.rerender();

        clearTimeout(this._store.state.longTouchTimeout);
      }
    }
  }
}
