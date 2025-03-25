import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelStore } from '../../stores/store';
import { AddObjectCommand } from '../commands/add-object.command';
import { AddSelectionCommand } from '../commands/add-selection.command';
import { ClearSelectionCommand } from '../commands/clear-selection.command';
import { ReplaceObjectsCommand } from '../commands/replace-objects.command';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelSelectionHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  constructor(store: KritzelStore) {
    super(store);
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
    if (this._store.state.isDragging && this._store.state.selectionGroup) {
      this.updateDragging(event);
    }

    if (this._store.state.isSelecting) {
      this.updateSelection(event);
    }
  }

  handleMouseUp(_event) {
    if (this._store.state.isDragging) {
      this.stopDragging();
    }

    if (this._store.state.isSelecting) {
      this.stopSelection();
      this.addSelectedObjectsToSelectionGroup();
    }
  }

  private getSelectedObject(event: MouseEvent): KritzelSelectionGroup | null {
    const path = event.composedPath().slice(1) as HTMLElement[];
    const objectElement = path.find(element => element.classList && element.classList.contains('object'));
    const object = this._store.findObjectById(objectElement?.id);

    if (!object) {
      return null;
    }

    if (object instanceof KritzelSelectionGroup) {
      return object;
    } else {
      const group = new KritzelSelectionGroup(this._store);
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

  private startDragging(selectedObject: KritzelSelectionGroup, event: MouseEvent): void {
    this._store.state.selectionGroup = selectedObject;
    this._store.state.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
  }

  private updateDragging(event: MouseEvent): void {
    this._store.state.selectionGroup.move(event.clientX, event.clientY, this.dragStartX, this.dragStartY);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this._store.rerender();
  }

  private stopDragging(): void {
    this._store.executeCommand(new ReplaceObjectsCommand(this._store, [this._store.state.selectionGroup]));
    this._store.state.isDragging = false;
    this._store.state.selectionGroup = null;
  }

  private startSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = new KrtizelSelectionBox(this._store);

    this.dragStartX = (clientX - this._store.state.translateX) / this._store.state.scale;
    this.dragStartY = (clientY - this._store.state.translateY) / this._store.state.scale;

    selectionBox.translateX = this.dragStartX;
    selectionBox.translateY = this.dragStartY;

    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = selectionBox;
    this._store.state.isSelecting = true;

    this._store.state.objects = [...this._store.state.objects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox)), selectionBox];
  }

  private updateSelection(event: MouseEvent): void {
    const { clientX, clientY } = event;
    const selectionBox = this._store.state.selectionBox;
    const currentX = (clientX - this._store.state.translateX) / selectionBox.scale;
    const currentY = (clientY - this._store.state.translateY) / selectionBox.scale;

    if (selectionBox) {
      selectionBox.width = Math.abs(currentX - this.dragStartX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.dragStartY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.dragStartX);
      selectionBox.translateY = Math.min(currentY, this.dragStartY);
    }

    this.updateSelectedObjects();

    this._store.rerender();
  }

  private updateSelectedObjects(): void {
    this._store.state.objects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => {
        const objectPolygon = object.rotatedPolygon;
        const selectionBoxPolygon = this._store.state.selectionBox.rotatedPolygon;

        object.selected = KritzelGeometryHelper.doPolygonsIntersect(objectPolygon, selectionBoxPolygon);
      });
  }

  private stopSelection(): void {
    this._store.state.selectionBox = null;
    this._store.state.isSelecting = false;
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = this._store.selectedObjects;

    if (selectedObjects.length > 0) {
      this._store.state.selectionGroup = new KritzelSelectionGroup(this._store);
      selectedObjects.forEach(o => {
        o.selected = false;
        this._store.state.selectionGroup.addOrRemove(o);
      });
      this._store.state.selectionGroup.selected = true;

      if (this._store.state.selectionGroup.length === 1) {
        this._store.state.selectionGroup.rotation = this._store.state.selectionGroup.objects[0].rotation;
      }

      this._store.executeCommand(new AddSelectionCommand(this._store, this._store.state.selectionGroup));
    } else {
      this._store.state.objects = [...this._store.state.objects.filter(o => !(o instanceof KrtizelSelectionBox))];
      // this._store.executeCommand(new ClearSelectionCommand(this._store));
    }
  }
}
