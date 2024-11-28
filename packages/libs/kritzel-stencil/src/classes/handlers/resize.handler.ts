import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelObject } from "../../interfaces/object.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";
import { kritzelViewportState } from "../../stores/viewport.store";

export class KritzelResizeHandler {
  isResizing: boolean = false;
  initialMouseX: number = 0;
  initialMouseY: number = 0;
  initialWidth: number = 0;
  initialHeight: number = 0;
  selectedObject: KritzelObject | null = null;

  constructor() {}

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const isHandleSelected = path.find(element => element.classList && element.classList.contains('selection-handle'));

      const selectedObject = findObjectById(objectElement.id);

      if (selectedObject && isHandleSelected) {
        this.isResizing = true;
        this.initialMouseX = event.clientX;
        this.initialMouseY = event.clientY;
        this.initialWidth = selectedObject.width;
        this.initialHeight = selectedObject.height;
        this.selectedObject = selectedObject;
      }
		}
  }

  handleMouseMove(event: MouseEvent): void {
    if(this.isResizing && this.selectedObject) {
      const dx = event.clientX - this.initialMouseX;
      const dy = event.clientY - this.initialMouseY;

      this.selectedObject.updateDimensions(this.initialWidth + dx / kritzelViewportState.scale, this.initialHeight + dy / kritzelViewportState.scale);

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isResizing) {
      this.isResizing = false;
      this.selectedObject = null;

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }

  }
}
