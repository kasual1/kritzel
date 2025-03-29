import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../store.class';
import { RotateSelectionGroupCommand } from '../commands/rotate-selection-group.command';
import { KritzelBaseHandler } from './base.handler';

export class KritzelRotationHandler extends KritzelBaseHandler{
  initialRotation: number = 0;

  rotation: number = 0;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {

      if (this._store.state.selectionGroup && this._store.state.isRotationHandleSelected) {
        this._store.state.isRotating = true;
        
        const centerX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
        const centerY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

        const cursorX = (event.clientX - this._store.state.translateX) / this._store.state.scale;
        const cursorY = (event.clientY - this._store.state.translateY) / this._store.state.scale;

        this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - this._store.state.selectionGroup.rotation;
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isRotating && this._store.state.selectionGroup) {
      const groupCenterX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / this._store.state.scale;
      const groupCenterY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / this._store.state.scale;

      const cursorX = (event.clientX - this._store.state.translateX) / this._store.state.scale;
      const cursorY = (event.clientY - this._store.state.translateY) / this._store.state.scale;

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
}
