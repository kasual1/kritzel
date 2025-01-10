import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelSelectionState } from '../../interfaces/selection-state.interface';
import { kritzelEngineState, findObjectById } from '../../stores/engine.store';
import { kritzelViewportState } from '../../stores/viewport.store';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KrtizelSelectionGroup } from '../objects/selection-group.class';

export class KritzelSelectionHandler {
  selectionState: KritzelSelectionState;

  dragStartX: number;
  dragStartY: number;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event)) {
      const selectedObject = this.getSelectedObject(event);
      const isHandleSelected = this.isHandleSelected(event);
      const isRotationHandleSelected = this.isRotationHandleSelected(event);

      if(!selectedObject?.selected){
        this.startSelection(event);
        this.updateSelection(event);
        this.stopSelection();
        this.addSelectedObjectsToSelectionGroup();
      }

      if (selectedObject?.selected && !isHandleSelected && !isRotationHandleSelected) {
        this.startDragging(selectedObject, event);
      }

      if (!selectedObject) {
        this.startSelection(event);
      }
    }
  }

  handleMouseMove(event) {
    if (this.selectionState.isDragging && this.selectionState.selectionGroup) {
      this.updateDragging(event);
    }

    if (this.selectionState.isSelecting) {
      this.updateSelection(event);
    }
  }

  handleMouseUp(_event) {
    if (this.selectionState.isDragging) {
      this.stopDragging();
    }

    if (this.selectionState.isSelecting) {
      this.stopSelection();
      this.addSelectedObjectsToSelectionGroup();
      return;
    }
  }

  private getSelectedObject(event: MouseEvent): KrtizelSelectionGroup | null {
    const path = event.composedPath() as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    return objectElement ? (findObjectById(objectElement.id) as KrtizelSelectionGroup) : null;
  }

  private isHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('selection-handle'));
  }

  private isRotationHandleSelected(event: MouseEvent): boolean {
    const path = event.composedPath() as HTMLElement[];
    return !!path.find(element => element.classList && element.classList.contains('rotation-handle'));
  }

  private startDragging(selectedObject: KrtizelSelectionGroup, event: MouseEvent): void {
    this.selectionState.selectionGroup = selectedObject;
    this.selectionState.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  private updateDragging(event: MouseEvent): void {
    this.selectionState.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private stopDragging(): void {
    this.selectionState.isDragging = false;
    this.selectionState.selectionGroup = null;
  }

  private startSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = new KrtizelSelectionBox();
    this.dragStartX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
    this.dragStartY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;
    selectionBox.translateX = this.dragStartX;
    selectionBox.translateY = this.dragStartY;
    this.selectionState.selectionGroup = null;
    this.selectionState.selectionBox = selectionBox;
    this.selectionState.isSelecting = true;
    this.selectionState.isDragging = true;

    kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup) && !(o instanceof KrtizelSelectionBox)), selectionBox];
  }

  private updateSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const currentX = (clientX - kritzelViewportState.translateX) / kritzelViewportState.scale;
    const currentY = (clientY - kritzelViewportState.translateY) / kritzelViewportState.scale;
    const selectionBox = this.selectionState.selectionBox;

    if (selectionBox) {
      selectionBox.width = Math.abs(currentX - this.dragStartX);
      selectionBox.height = Math.abs(currentY - this.dragStartY);
      selectionBox.translateX = Math.min(currentX, this.dragStartX);
      selectionBox.translateY = Math.min(currentY, this.dragStartY);
    }

    this.updateSelectedObjects();

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private updateSelectedObjects(): void {
    const objectBox: KritzelBoundingBox = {
      x: this.selectionState.selectionBox.translateX,
      y: this.selectionState.selectionBox.translateY,
      width: this.selectionState.selectionBox.width,
      height: this.selectionState.selectionBox.height,
    };

    kritzelEngineState.objects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => {
        if (this.isBoundingBoxOverlapping(objectBox, object.boundingBox)) {
          object.selected = true;
        } else {
          object.selected = false;
        }
      });
  }

  private stopSelection(): void {
    this.selectionState.selectionBox = null;
    this.selectionState.isSelecting = false;
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)).filter(o => o.selected);

    if (selectedObjects.length > 0) {
      const selectionGroup = new KrtizelSelectionGroup();
      selectedObjects.forEach(o => {
        o.selected = false;
        selectionGroup.addOrRemove(o);
      });
      selectionGroup.selected = true;

      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox)), selectionGroup];
    } else {
      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
    }

  }

  private isBoundingBoxOverlapping(box1: { x: number; y: number; width: number; height: number }, box2: { x: number; y: number; width: number; height: number }): boolean {
    return box1.x < box2.x + box2.width && box1.x + box1.width > box2.x && box1.y < box2.y + box2.height && box1.y + box1.height > box2.y;
  }
}
