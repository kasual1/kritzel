import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelObject } from "../../interfaces/object.interface";
import { kritzelEngineState, findObjectById, deselectAllObjects } from "../../stores/engine.store";
import { kritzelViewportState } from "../../stores/viewport.store";

export class KritzelSelectionHandler {
    isDragging: boolean = false;
    dragStartX: number = 0;
    dragStartY: number = 0;
    selectedObject: KritzelObject | null = null;

    constructor() {}

    handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        deselectAllObjects();
      }

      if (event.key === 'Delete') {
        const objectsToRemove = kritzelEngineState.objects.filter((object) => object.selected);
        kritzelEngineState.objects = kritzelEngineState.objects.filter((object) => !object.selected);

        for (const object of objectsToRemove) {
          object.markedForRemoval = true;
        }
      }
    }

    handleMouseDown(event) {
      if (KritzelClickHelper.isLeftClick(event)) {
        const { clientX, clientY } = event;
        const path = event.composedPath() as HTMLElement[];
        const isHandleSelected = path.find(element => element.classList && element.classList.contains('selection-handle'));

        if(this.selectedObject && !isHandleSelected) {
          this.isDragging = true;
          this.dragStartX = clientX;
          this.dragStartY = clientY;
        }

      }
    }

    handleMouseMove(event) {
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

    handleMouseUp(event) {
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

              deselectAllObjects();
              object.selected = true;
              noObjectSelected = false;
              this.selectedObject = object;
              break;
            }
          }
        }

        if (noObjectSelected === true) {
            deselectAllObjects();
        }

        kritzelEngineState.objects = [...kritzelEngineState.objects];
      }
    }

}
