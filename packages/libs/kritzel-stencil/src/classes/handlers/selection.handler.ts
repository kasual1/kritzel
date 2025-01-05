import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState, findObjectById, deselectAllObjects } from "../../stores/engine.store";
import { KrtizelGroup } from "../objects/group.class";

export class KritzelSelectionHandler {

  selectionState: KritzelSelectionState;

  dragStartX: number;
  dragStartY: number;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event)) {
      const path = event.composedPath() as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const isHandleSelected = path.find(element => element.classList && element.classList.contains('selection-handle'));
      const isRotationHandleSelected = path.find(element => element.classList && element.classList.contains('rotation-handle'));

      const selectedObject = objectElement ? findObjectById(objectElement.id) : null;

      if (selectedObject?.selected && !isHandleSelected && !isRotationHandleSelected) {
        this.selectionState.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
      }

    }
  }

  handleMouseMove(event) {
    if (this.selectionState.isDragging && this.selectionState.selectedObject) {
      this.selectionState.selectedObject.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(event) {
    debugger;
    if (this.selectionState.isDragging) {
      this.selectionState.isDragging = false;
      this.selectionState.selectedObject = null;
    }

    if (KritzelClickHelper.isLeftClick(event) && !this.selectionState.isRotating && !this.selectionState.isDragging) {
      const path = event.composedPath() as HTMLElement[];
      const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

      let noObjectSelected = true;

      if (selectedObject) {
        for (const object of kritzelEngineState.objects) {
          if (selectedObject.id === object.id) {

            if (this.selectionState.isCtrlKeyPressed === false) {
              deselectAllObjects();
              this.selectionState.selectedObject = null;
            }

            object.selected = !object.selected;
            noObjectSelected = false;


            if(this.selectionState.selectedObject === null) {
              this.selectionState.selectedObject = new KrtizelGroup();
            }

            this.selectionState.selectedObject.addOrRemove(object);

            if(this.selectionState.selectedObject.objects.length > 1) {
              this.selectionState.selectedObject.deselectAllChildren();
              this.selectionState.selectedObject.selected = true;
              kritzelEngineState.objects =  [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup)), this.selectionState.selectedObject];
            } else {
              this.selectionState.selectedObject.selected = false;
              kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup))];
            }

            break;
          }
        }
      }

      if (noObjectSelected === true) {
        deselectAllObjects();
        this.selectionState.selectedObject = null;
        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup))];
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

}
