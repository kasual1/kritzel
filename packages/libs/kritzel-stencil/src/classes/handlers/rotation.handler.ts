import { KritzelMouseHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../store.class';
import { RotateSelectionGroupCommand } from '../commands/rotate-selection-group.command';
import { KritzelBaseHandler } from './base.handler';

export class KritzelRotationHandler extends KritzelBaseHandler {
  initialRotation: number = 0;

  rotation: number = 0;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelMouseHelper.isLeftClick(event)) {
      if (this._store.state.selectionGroup && this._store.state.isRotationHandleSelected) {
        const clientX = event.clientX - this._store.offsetX;
        const clientY = event.clientY - this._store.offsetY;

        this._store.state.isRotating = true;

        const centerX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
        const centerY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

        const cursorX = (clientX - this._store.state.translateX) / this._store.state.scale;
        const cursorY = (clientY - this._store.state.translateY) / this._store.state.scale;

        this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - this._store.state.selectionGroup.rotation;
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isRotating && this._store.state.selectionGroup) {
      const clientX = event.clientX - this._store.offsetX;
      const clientY = event.clientY - this._store.offsetY;

      const groupCenterX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
      const groupCenterY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

      const cursorX = (clientX - this._store.state.translateX) / this._store.state.scale;
      const cursorY = (clientY - this._store.state.translateY) / this._store.state.scale;

      const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

      this.rotation = currentRotation - this.initialRotation;

      this._store.state.selectionGroup.rotate(this.rotation);

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isRotating) {
      this._store.history.executeCommand(new RotateSelectionGroupCommand(this._store, this, this.rotation));

      this._store.state.isRotating = false;

      this.initialRotation = 0;
      this.rotation = 0;
    }
  }

  handleTouchStart(event: TouchEvent): void {
    const firstTouch = event.touches[0];

    if (!firstTouch) {
      return;
    }

    if (this._store.state.touchCount === 1) {
      if (this._store.state.selectionGroup && this._store.state.isRotationHandleSelected) {
        const clientX = Math.round(firstTouch.clientX - this._store.offsetX);
        const clientY = Math.round(firstTouch.clientY - this._store.offsetY);

        this._store.state.isRotating = true;

        const centerX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
        const centerY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

        const cursorX = (clientX - this._store.state.translateX) / this._store.state.scale;
        const cursorY = (clientY - this._store.state.translateY) / this._store.state.scale;

        this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - this._store.state.selectionGroup.rotation;

        clearTimeout(this._store.state.longTouchTimeout);
      }
    }
  }

  handleTouchMove(event: TouchEvent): void {
    const firstTouch = event.touches[0];

    if (!firstTouch) {
      return;
    }

    if (this._store.state.isRotating && this._store.state.selectionGroup) {
      const clientX = Math.round(firstTouch.clientX - this._store.offsetX);
      const clientY = Math.round(firstTouch.clientY - this._store.offsetY);

      const groupCenterX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
      const groupCenterY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

      const cursorX = (clientX - this._store.state.translateX) / this._store.state.scale;
      const cursorY = (clientY - this._store.state.translateY) / this._store.state.scale;

      const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

      this.rotation = currentRotation - this.initialRotation;

      this._store.state.selectionGroup.rotate(this.rotation);

      clearTimeout(this._store.state.longTouchTimeout);
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
    if (this._store.state.isRotating) {
      this._store.history.executeCommand(new RotateSelectionGroupCommand(this._store, this, this.rotation));

      this._store.state.isRotating = false;

      this.initialRotation = 0;
      this.rotation = 0;

      clearTimeout(this._store.state.longTouchTimeout);
    }
  }
}
