import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";
import { KrtizelSelection } from "../objects/selection.class";

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
    if (this.selectionState.isDragging && this.selectionState.selection) {
      this.selectionState.selection.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(event) {
    if (this.selectionState.isDragging) {
      this.selectionState.isDragging = false;
      this.selectionState.selection = null;
    }

    if (KritzelClickHelper.isLeftClick(event) && !this.selectionState.isRotating) {
      const path = event.composedPath() as HTMLElement[];
      const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

      let noObjectSelected = true;

      if (selectedObject) {
        for (const object of kritzelEngineState.objects) {
          if (selectedObject.id === object.id) {
            
            if (this.selectionState.isCtrlKeyPressed === false) {
              this.selectionState.selection = null;
            }

            if(this.selectionState.selection === null) {
              this.selectionState.selection = new KrtizelSelection();
            }

            if((object instanceof KrtizelSelection) === false) {
              this.selectionState.selection.addOrRemove(object);
              this.selectionState.selection.selected = true;
              noObjectSelected = false;
  
              kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelection)), this.selectionState.selection];
            }

            break;
          }
        }
      }

      if (noObjectSelected === true) {
        this.selectionState.selection = null;
        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelection))];
      }

    }
  }

}
