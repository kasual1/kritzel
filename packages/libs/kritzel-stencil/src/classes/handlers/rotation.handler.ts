import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelObject } from "../../interfaces/object.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";


export class KritzelRotationHandler {
	isRotating: boolean = false;
	selectedObject: KritzelObject | null = null;
	initialRotation: number = 0;

	constructor() { }

	handleMouseDown(event: MouseEvent): void {
		if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const objectElement = path.find(element => element.classList && element.classList.contains('object'));
			const rotationHandle = path.find(element => element.classList && element.classList.contains('rotation-handle'));

			const isRotationHandleSelected = rotationHandle ? true : false;

			const selectedObject = findObjectById(objectElement?.id);

			if (selectedObject && isRotationHandleSelected) {
				this.isRotating = true;
				this.selectedObject = selectedObject;
				this.initialRotation = selectedObject.rotation;
			}
		}
	}

	handleMouseMove(event: MouseEvent): void {
		if (this.isRotating && this.selectedObject) {
			const deltaX = event.clientX - this.selectedObject.translateX;
			const deltaY = event.clientY - this.selectedObject.translateY;
			const rotation = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

			let degrees = rotation - this.initialRotation;

			if (degrees < 0) {
				degrees += 360;
			}

			this.selectedObject.rotate(degrees);

			kritzelEngineState.objects = [...kritzelEngineState.objects];
		}
	}

	handleMouseUp(_event: MouseEvent): void {
		if (this.isRotating) {
			this.isRotating = false;
			this.selectedObject = null;

			kritzelEngineState.objects = [...kritzelEngineState.objects];
		}
	}
}
