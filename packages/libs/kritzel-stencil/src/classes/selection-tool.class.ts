import { KritzelTool } from "../components";
import { KritzelClickHelper } from "../helpers/click.helper";
import { kritzelEngineState } from "../stores/engine.store";
import { kritzelViewportState } from "../stores/viewport.store";
import { KritzelObjectBase } from "./object.class";

export class KritzelSelectionTool implements KritzelTool {
	name: string = 'selection';
	icon: string = 'selection';

	handleMouseDown(_event: MouseEvent): void {
		// Do nothing
	}

	handleMouseMove(_event: MouseEvent): void {
		// Do nothing
	}

	handleMouseUp(event: MouseEvent): void {
		if (KritzelClickHelper.isLeftClick(event)) {
			const { clientX, clientY } = event;
			const adjustedClientX = (kritzelViewportState.translateX + clientX) / kritzelViewportState.scale;
			const adjustedClientY = (kritzelViewportState.translateY + clientY) / kritzelViewportState.scale;
			let objectSelected = false;

			const translateX = kritzelViewportState.translateX;
			const translateY = kritzelViewportState.translateY;
			const scale = kritzelViewportState.scale;

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