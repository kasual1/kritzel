import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";

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
				this.selectionState.isRotating = true;
				this.selectionState.selectedObject = selectedObject;
				
				const centerX = selectedObject.translateX + selectedObject.width / 2;
				const centerY = selectedObject.translateY + selectedObject.height / 2;

				this.initialRotation = Math.atan2(centerY - event.clientY,
					centerX - event.clientX) - selectedObject.rotation;
			}
		}
	}

	handleMouseMove(event: MouseEvent): void {
		if (this.selectionState.isRotating && this.selectionState.selectedObject) {
			const centerX = this.selectionState.selectedObject.translateX + this.selectionState.selectedObject.width / 2;
			const centerY = this.selectionState.selectedObject.translateY + this.selectionState.selectedObject.height / 2;

			const currentRotation = Math.atan2(centerY - event.clientY,
				centerX - event.clientX);
				

			this.selectionState.selectedObject.rotation = currentRotation - this.initialRotation;

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
