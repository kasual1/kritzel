import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { kritzelEngineState, findObjectById } from '../../stores/engine.store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KrtizelSelectionGroup } from '../objects/selection-group.class';

export class KritzelRotationHandler {
  selectionState: KritzelSelectionState;

  initialRotation: number = 0;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
      const path = event.composedPath() as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const rotationHandle = path.find(element => element.classList && element.classList.contains('rotation-handle'));

      const isRotationHandleSelected = rotationHandle ? true : false;

      const selectedObject = findObjectById(objectElement?.id);

      if (selectedObject && isRotationHandleSelected) {
        this.selectionState.selectionGroup = selectedObject as KrtizelSelectionGroup;
        this.selectionState.isRotating = true;

        const centerX = selectedObject.translateX + selectedObject.width / 2;
        const centerY = selectedObject.translateY + selectedObject.height / 2;

        const cursorX = (event.clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
        const cursorY = (event.clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

        this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - selectedObject.rotation;
      }
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this.selectionState.isRotating && this.selectionState.selectionGroup) {
      const groupCenterX = this.selectionState.selectionGroup.translateX + this.selectionState.selectionGroup.width / 2;
      const groupCenterY = this.selectionState.selectionGroup.translateY + this.selectionState.selectionGroup.height / 2;

      const cursorX = (event.clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
      const cursorY = (event.clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;

      const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

      this.selectionState.selectionGroup.rotate(currentRotation - this.initialRotation);

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.selectionState.isRotating) {
      this.selectionState.isRotating = false;

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }
}
