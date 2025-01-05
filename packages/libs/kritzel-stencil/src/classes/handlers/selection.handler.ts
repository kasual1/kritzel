import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";
import { KrtizelSelectionBox } from "../objects/selection-box.class";
import { KrtizelSelectionGroup } from "../objects/selection-group.class";

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

      if(!selectedObject){
        const selectionBox = new KrtizelSelectionBox();
        selectionBox.translateX = event.clientX;
        selectionBox.translateY = event.clientY;
        this.selectionState.selectionBox = selectionBox;
        this.selectionState.isDragging = true;

        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        
        kritzelEngineState.objects = [...kritzelEngineState.objects, selectionBox];
      }

    }
  }

  handleMouseMove(event) {
    if (this.selectionState.isDragging && this.selectionState.selectionGroup) {
      this.selectionState.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      
      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }

    if(this.selectionState.isDragging && this.selectionState.selectionBox) {

      const width = event.clientX - this.dragStartX;
      const height = event.clientY - this.dragStartY;

      const translateX = width < 0 ? event.clientX : this.dragStartX;
      const translateY = height < 0 ? event.clientY : this.dragStartY;

      this.selectionState.selectionBox.width = Math.abs(event.clientX - this.dragStartX);
      this.selectionState.selectionBox.height = Math.abs(event.clientY - this.dragStartY);

      this.selectionState.selectionBox.translateX = translateX;
      this.selectionState.selectionBox.translateY = translateY;
      
      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(event) {
    if (this.selectionState.isDragging) {
      this.selectionState.isDragging = false;
      this.selectionState.selectionGroup = null;
      this.selectionState.selectionBox = null;

      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
    }

    if (KritzelClickHelper.isLeftClick(event) && !this.selectionState.isRotating) {
      const path = event.composedPath() as HTMLElement[];
      const selectedObject = path.find(element => element.classList && element.classList.contains('object'));

      let noObjectSelected = true;

      if (selectedObject) {
        for (const object of kritzelEngineState.objects) {
          if (selectedObject.id === object.id) {
            
            if (this.selectionState.isCtrlKeyPressed === false) {
              this.selectionState.selectionGroup = null;
            }

            if(this.selectionState.selectionGroup === null) {
              this.selectionState.selectionGroup = new KrtizelSelectionGroup();
            }

            if((object instanceof KrtizelSelectionGroup) === false) {
              this.selectionState.selectionGroup.addOrRemove(object);
              this.selectionState.selectionGroup.selected = true;
              noObjectSelected = false;
  
              kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)), this.selectionState.selectionGroup];
            }

            break;
          }
        }
      }

      if (noObjectSelected === true) {
        this.selectionState.selectionGroup = null;
        kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup))];
      }

    }
  }

}
