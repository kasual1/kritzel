import { KritzelClickHelper } from "../../helpers/click.helper";
import { kritzelEngineState, findObjectById, deselectAllObjects } from "../../stores/engine.store";
import { kritzelViewportState } from "../../stores/viewport.store";
import { KritzelBaseObject } from "../objects/base-object.class";

export class KritzelSelectionHandler {
    private static instance: KritzelSelectionHandler;

    isDragging: boolean = false;
    dragStartX: number = 0;
    dragStartY: number = 0;
    selectedObject: KritzelBaseObject<any> | null = null;
    copiedObject: KritzelBaseObject<any> | null = null;

    constructor() {
      if (KritzelSelectionHandler.instance) {
        return KritzelSelectionHandler.instance;
      }
      KritzelSelectionHandler.instance = this;
    }

    handleMouseDown(event) {
      if (KritzelClickHelper.isLeftClick(event)) {
        const { clientX, clientY } = event;
        const path = event.composedPath() as HTMLElement[];
        const objectElement = path.find(element => element.classList && element.classList.contains('object'));
        const isHandleSelected = path.find(element => element.classList && element.classList.contains('selection-handle'));
        const isRotationHandleSelected = path.find(element => element.classList && element.classList.contains('rotation-handle'));

        const selectedObject = objectElement ? findObjectById(objectElement.id) : null;

        if(selectedObject?.selected && !isHandleSelected && !isRotationHandleSelected) {
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

    handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.handleEscape();
      }

      if (event.key === 'Delete') {
        this.handleDelete();
      }

      if (event.key === 'c' && event.ctrlKey) {
        this.handleCopy();
      }
      
      if (event.key === 'v' && event.ctrlKey) {
        this.handlePaste();
      }

    }

    private handleEscape() {
      deselectAllObjects();
    }

    private handleDelete() {
      const objectsToRemove = kritzelEngineState.objects.filter((object) => object.selected);
      kritzelEngineState.objects = kritzelEngineState.objects.filter((object) => !object.selected);

      for (const object of objectsToRemove) {
        object.markedForRemoval = true;
      }
    }

    private handleCopy() {
      this.copiedObject = this.selectedObject.copy();
      this.copiedObject.id = this.copiedObject.generateId();
      this.copiedObject.translateX += 25;
      this.copiedObject.translateY += 25;
      this.copiedObject.selected = false;
    }

    private handlePaste() {
      deselectAllObjects();
      this.selectedObject = this.copiedObject;
      this.copiedObject.selected = true;
      kritzelEngineState.objects = [...kritzelEngineState.objects, this.copiedObject];
    }

}
