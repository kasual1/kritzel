import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { ResizeSelectionGroupCommand } from '../commands/resize-selection-group.command';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;

  initialSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  newSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  hasResized: boolean = false;

  constructor(core: KritzelCore) {
    super(core);
  }

  private reset() {
    this.initialMouseX = 0;
    this.initialMouseY = 0;
    this.initialSize = { x: 0, y: 0, width: 0, height: 0 };
    this.newSize = { x: 0, y: 0, width: 0, height: 0 };
    this.hasResized = false;
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup && this._core.store.state.isResizeHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.state.isResizing = true;
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = selectionGroup.width;
          this.initialSize.height = selectionGroup.height;
          this.initialSize.x = selectionGroup.translateX;
          this.initialSize.y = selectionGroup.translateY;
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      if (activePointers.length === 1) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup && this._core.store.state.isResizeHandleSelected) {
          const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
          const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

          this._core.store.state.isResizing = true;
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = selectionGroup.width;
          this.initialSize.height = selectionGroup.height;
          this.initialSize.x = selectionGroup.translateX;
          this.initialSize.y = selectionGroup.translateY;

          clearTimeout(this._core.store.state.longTouchTimeout);
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isResizing && selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        const resizeDeltaX = Math.abs(dx);
        const resizeDeltaY = Math.abs(dy);
        const resizeThreshold = 5;

        if (resizeDeltaX > resizeThreshold || resizeDeltaY > resizeThreshold) {
          this.hasResized = true;
        }

        if (!this.hasResized) {
          return;
        }

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
        }

        selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const oneFingerTouch = activePointers[0];

      if (!oneFingerTouch) {
        return;
      }

      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isResizing && selectionGroup) {
        const clientX = Math.round(oneFingerTouch.clientX - this._core.store.offsetX);
        const clientY = Math.round(oneFingerTouch.clientY - this._core.store.offsetY);

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        const resizeDeltaX = Math.abs(dx);
        const resizeDeltaY = Math.abs(dy);
        const resizeThreshold = 5;

        if (resizeDeltaX > resizeThreshold || resizeDeltaY > resizeThreshold) {
          clearTimeout(this._core.store.state.longTouchTimeout);
          this.hasResized = true;
        }

        if (!this.hasResized) {
          return;
        }

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
        }

        selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isResizing) {
        this._core.store.state.isResizing = false;

        if (this.hasResized) {
          this._core.commandManager.executeCommand(new ResizeSelectionGroupCommand(this._core, this, structuredClone(this.initialSize), structuredClone(this.newSize)));
          this._core.store.state.hasObjectsChanged = true;
        }

        this.reset();
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isResizing) {
        this._core.store.state.isResizing = false;

        if (this.hasResized) {
          this._core.commandManager.executeCommand(new ResizeSelectionGroupCommand(this._core, this, structuredClone(this.initialSize), structuredClone(this.newSize)));
          this._core.store.state.hasObjectsChanged = true;
        }

        this.reset();

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }
}
