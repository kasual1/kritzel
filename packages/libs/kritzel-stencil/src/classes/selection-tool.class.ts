import { KritzelTool } from "../components";
import { KritzelClickHelper } from "../helpers/click.helper";
import { KritzelObject } from "../interfaces/object.interface";
import { kritzelEngineState } from "../stores/engine.store";
import { kritzelViewportState } from "../stores/viewport.store";
import { KritzelObjectBase } from "./object.class";

export class KritzelSelectionTool implements KritzelTool {
	name: string = 'selection';
	icon: string = 'selection';

	isDragging: boolean = false;
	dragStartX: number = 0;
	dragStartY: number = 0;
	selectedObject: KritzelObject | null = null;

	constructor() {
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
	}

	handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			this.deselectAllObjects();
			kritzelEngineState.selectedObjects = [];
		}

		if(event.key === 'Delete') {
			const objectsToRemove = kritzelEngineState.objects.filter((object) => object.selected);
			kritzelEngineState.objects = kritzelEngineState.objects.filter((object) => !object.selected);
			kritzelEngineState.selectedObjects = [];

			for (const object of objectsToRemove) {
				object.markedForRemoval = true;
			}
		}
	}

	handleMouseDown(event: MouseEvent): void {
		if (KritzelClickHelper.isLeftClick(event)) {
			const { clientX, clientY } = event;
			const adjustedClientX = (kritzelViewportState.translateX + clientX) / kritzelViewportState.scale;
			const adjustedClientY = (kritzelViewportState.translateY + clientY) / kritzelViewportState.scale;

			for (const object of kritzelEngineState.objects) {
				if (object.isPointInBoundingBox(adjustedClientX, adjustedClientY)) {
					if (object.selected) {
						this.isDragging = true;
						this.dragStartX = clientX;
						this.dragStartY = clientY;
						this.selectedObject = object;
						break;
					}
				}
			}
		}
	}

	handleMouseMove(event: MouseEvent): void {
		if (this.isDragging && this.selectedObject) {
			const { clientX, clientY } = event;
			const deltaX = (clientX - this.dragStartX) / kritzelViewportState.scale;
			const deltaY = (clientY - this.dragStartY) / kritzelViewportState.scale;
	  
			this.selectedObject.translateX += deltaX;
			this.selectedObject.translateY += deltaY;
	  
			this.dragStartX = clientX;
			this.dragStartY = clientY;

			kritzelEngineState.objects = [...kritzelEngineState.objects];
		  }
	}

	handleMouseUp(event: MouseEvent): void {
		if(this.isDragging) {
			this.isDragging = false;
			this.selectedObject = null;
		}

		if (KritzelClickHelper.isLeftClick(event)) {
			const { clientX, clientY } = event;
			const adjustedClientX = (kritzelViewportState.translateX + clientX) / kritzelViewportState.scale;
			const adjustedClientY = (kritzelViewportState.translateY + clientY) / kritzelViewportState.scale;
			let objectSelected = false;

			for (const object of kritzelEngineState.objects) {
				if (object.isPointInBoundingBox(adjustedClientX, adjustedClientY)) {

					this.deselectAllObjects();
					object.selected = true;
					objectSelected = true;
					break;
				}
			}

			if (!objectSelected) {
				this.deselectAllObjects();
			}

			const selectedObjects = kritzelEngineState.objects.filter((object) => object.selected);
			kritzelEngineState.selectedObjects = selectedObjects;
		}
	}

	handleWheel(_event: WheelEvent): void {
		// Do nothing
	}

	private deselectAllObjects(): void {
		for (const object of kritzelEngineState.objects) {
			object.selected = false;
		}
	}

	setSelectedObjects(objects: KritzelObjectBase[]): void {
		this.deselectAllObjects();

		for (const object of objects) {
			const objectToSelect = kritzelEngineState.objects.find((o) => o.id === object.id);
			if (objectToSelect) {
				objectToSelect.selected = true;
			}
		}

		kritzelEngineState.selectedObjects = objects;
	}
}