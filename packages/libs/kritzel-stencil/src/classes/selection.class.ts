import { KritzelTool } from "../components";
import { kritzelEngineState } from "../stores/engine.store";
import { kritzelViewportState } from "../stores/viewport.store";

export class KritzelSelection implements KritzelTool {
	name: string = 'selection';
	icon: string = 'selection';

	handleMouseDown(_event: MouseEvent): void {
		// Do nothing
	}

	handleMouseMove(_event: MouseEvent): void {
		// Do nothing
	}

	handleMouseUp(event: MouseEvent): void {
		const { clientX, clientY } = event;
		const adjustedClientX = (kritzelViewportState.translateX + clientX) / kritzelViewportState.scale;
		const adjustedClientY = (kritzelViewportState.translateY + clientY) / kritzelViewportState.scale;
		let objectSelected = false;
		console.log(adjustedClientX, adjustedClientY);

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

	handleWheel(_event: WheelEvent): void {
		// Do nothing
	}

	private deselectAllObjects(): void {
		for (const object of kritzelEngineState.objects) {
			object.selected = false;
		}
	}
}