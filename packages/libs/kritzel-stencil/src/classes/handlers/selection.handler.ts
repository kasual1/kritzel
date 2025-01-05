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
    if (this.selectionState.isDragging) {
      this.selectionState.isDragging = false;
      this.selectionState.selectedObject = null;
    }

    if (KritzelClickHelper.isLeftClick(event) && !this.selectionState.isRotating) {
      const path = event.composedPath() as HTMLElement[];
      const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

      let noObjectSelected = true;

      if (selectedObject) {
        for (const object of kritzelEngineState.objects) {
          if (selectedObject.id === object.id) {

            if (this.selectionState.isCtrlKeyPressed === false) {
              deselectAllObjects();
              this.selectionState.selectedGroup.clear();
            }

            object.selected = !object.selected;
            noObjectSelected = false;

            this.selectionState.selectedObject = object;
            this.selectionState.selectedGroup.addOrRemove(object);

            if(this.selectionState.selectedGroup.objects.length > 1) {
              this.selectionState.selectedGroup.deselectAllChildren();
              this.selectionState.selectedObject = this.selectionState.selectedGroup;
              this.selectionState.selectedGroup.selected = true;
              kritzelEngineState.objects =  [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup)), this.selectionState.selectedGroup];
            } else {
              this.selectionState.selectedGroup.selected = false;
              kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup))];
            }

            break;
          }
        }
      }

      if (noObjectSelected === true) {
        deselectAllObjects();
        this.selectionState.selectedGroup.clear();
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

}
