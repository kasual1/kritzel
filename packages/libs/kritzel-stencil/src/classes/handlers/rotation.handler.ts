import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../../stores/store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KritzelHistory } from '../history.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base-handler';

export class KritzelRotationHandler extends KritzelBaseHandler{
  initialRotation: number = 0;

  history: KritzelHistory;

  constructor(store: KritzelStore) {
    super(store);
    this.history = new KritzelHistory(this._store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      const path = event.composedPath() as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const rotationHandle = path.find(element => element.classList && element.classList.contains('rotation-handle'));

      const isRotationHandleSelected = rotationHandle ? true : false;

      const selectedObject = this._store.findObjectById(objectElement?.id);

      if (selectedObject && isRotationHandleSelected) {
        this._store.state.selectionGroup = selectedObject as KritzelSelectionGroup;
        this._store.state.isRotating = true;

        const centerX = selectedObject.translateX + selectedObject.width / 2 / kritzelViewportState.scale;
        const centerY = selectedObject.translateY + selectedObject.height / 2 / kritzelViewportState.scale;

        const cursorX = (event.clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
        const cursorY = (event.clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

        this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - selectedObject.rotation;
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isRotating && this._store.state.selectionGroup) {
      const groupCenterX = this._store.state.selectionGroup.translateX + this._store.state.selectionGroup.width / 2 / kritzelViewportState.scale;
      const groupCenterY = this._store.state.selectionGroup.translateY + this._store.state.selectionGroup.height / 2 / kritzelViewportState.scale;

      const cursorX = (event.clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
      const cursorY = (event.clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

      const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

      this._store.state.selectionGroup.rotate(currentRotation - this.initialRotation);

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isRotating) {
      this._store.state.isRotating = false;

      this._store.rerender();

      this.history.forceCreateSnapshot();
    }
  }
}
