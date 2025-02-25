import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
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
      const isResizeHandleSelected = this.isHandleSelected(event);
      const isRotationHandleSelected = this.isRotationHandleSelected(event);

      if (!selectedObject?.selected) {
        this.startSelection(event);
        this.updateSelection(event);
        this.stopSelection();
        this.addSelectedObjectsToSelectionGroup();
      }

      if (selectedObject?.selected && !isResizeHandleSelected && !isRotationHandleSelected) {
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
    const object = findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KrtizelSelectionGroup) {
      return object;
    } else {
      const group = new KrtizelSelectionGroup();
      group.translateX = 0;
      group.translateY = 0;
      group.addOrRemove(object);
      return group;
    }
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

    kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup) && !(o instanceof KrtizelSelectionBox)), selectionBox];
  }

  private updateSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = this.selectionState.selectionBox;
    const currentX = (clientX - kritzelViewportState.translateX) / selectionBox.scale;
    const currentY = (clientY - kritzelViewportState.translateY) / selectionBox.scale;

    if (selectionBox) {
      selectionBox.width = Math.abs(currentX - this.dragStartX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.dragStartY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.dragStartX);
      selectionBox.translateY = Math.min(currentY, this.dragStartY);
    }

    this.updateSelectedObjects();

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  private updateSelectedObjects(): void {
    kritzelEngineState.objects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => {
        const objectPolygon = object.rotatedPolygon;
        const selectionBoxPolygon = this.selectionState.selectionBox.rotatedPolygon;
        
        object.selected = KritzelGeometryHelper.doPolygonsIntersect(
          objectPolygon,
          selectionBoxPolygon
        );
      });
  }

  private stopSelection(): void {
    this.selectionState.selectionBox = null;
    this.selectionState.isSelecting = false;
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)).filter(o => o.selected);

    if (selectedObjects.length > 0) {
      this.selectionState.selectionGroup = new KrtizelSelectionGroup();
      selectedObjects.forEach(o => {
        o.selected = false;
        this.selectionState.selectionGroup.addOrRemove(o);
      });
      this.selectionState.selectionGroup.selected = true;

      if (this.selectionState.selectionGroup.length === 1) {
        this.selectionState.selectionGroup.rotation = this.selectionState.selectionGroup.objects[0].rotation;
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox)), this.selectionState.selectionGroup];
    } else {
      kritzelEngineState.objects = [...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
    }
  }
}
