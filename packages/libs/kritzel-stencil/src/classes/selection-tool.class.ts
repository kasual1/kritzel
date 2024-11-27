import { KritzelTool } from "../components";
import { KritzelClickHelper } from "../helpers/click.helper";
import { KritzelObject } from "../interfaces/object.interface";
import { kritzelEngineState } from "../stores/engine.store";
import { kritzelViewportState } from "../stores/viewport.store";
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
		}

		if (event.key === 'Delete') {
			const objectsToRemove = kritzelEngineState.objects.filter((object) => object.selected);
			kritzelEngineState.objects = kritzelEngineState.objects.filter((object) => !object.selected);

			for (const object of objectsToRemove) {
				object.markedForRemoval = true;
			}
		}
	}

	handleMouseDown(event: MouseEvent): void {
		if (KritzelClickHelper.isLeftClick(event)) {
			const { clientX, clientY } = event;
			const path = event.composedPath() as HTMLElement[];
			const selectedObject = path.find(element => element.classList && element.classList.contains('object'));
			const selectedObjects = kritzelEngineState.objects.filter((object) => object.selected);

			if (selectedObject) {
				for (const object of selectedObjects) {
					if (selectedObject.id === object.id) {
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
		if (this.isDragging) {
			this.isDragging = false;
			this.selectedObject = null;
		}

		if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const selectedObject = path.find(element => element.classList && element.classList.contains('object'));
			
			let noObjectSelected = true;

			if (selectedObject) {
				for (const object of kritzelEngineState.objects) {
					if (selectedObject.id === object.id) {

						this.deselectAllObjects();
						object.selected = true;
						console.log({
							topLeft: object.boundingBoxTopLeft,
							topRight: object.boundingBoxTopRight,
							bottomLeft: object.boundingBoxBottomLeft,
							bottomRight: object.boundingBoxBottomRight,
						});
						noObjectSelected = false;
						break;
					}
				}
			}

			if (noObjectSelected === true) {
				this.deselectAllObjects();
			}

			kritzelEngineState.objects = [...kritzelEngineState.objects];
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
}