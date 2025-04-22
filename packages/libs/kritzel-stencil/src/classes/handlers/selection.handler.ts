import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelStore } from '../store.class';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelSelectionHandler extends KritzelBaseHandler {
  selectionStartX: number;
  selectionStartY: number;

  get isSelectionClick() {
    return this._store.state.selectionBox && this._store.state.selectionBox.width === 0 && this._store.state.selectionBox.height === 0;
  }

  get isSelectionDrag() {
    return this._store.state.selectionBox && (this._store.state.selectionBox.width > 0 || this._store.state.selectionBox.height > 0);
  }

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event) {
    if (KritzelClickHelper.isLeftClick(event) && !this._store.state.selectionGroup) {
      this.startMouseSelection(event);
    }
  }

  handleMouseMove(event) {
    if (this._store.state.isSelecting) {
      this.updateMouseSelection(event);
    }
  }

  handleMouseUp(event) {
    if (KritzelClickHelper.isLeftClick(event) && this._store.state.isSelecting) {
      if (this.isSelectionClick) {
        this.updateMouseSelection(event);
        this.addSelectedObjectAtIndexToSelectionGroup(0);
        this.removeSelectionBox();
      }

      if (this.isSelectionDrag) {
        this.updateMouseSelection(event);
        this.addSelectedObjectsToSelectionGroup();
        this.removeSelectionBox();
      }
    }
  }

  handleTouchStart(event: TouchEvent) {
    if (this._store.state.touchCount === 1 && !this._store.state.selectionGroup) {
      this.startTouchSelection(event);
    }
  }

  handleTouchMove(event: TouchEvent) {
    if (this._store.state.isSelecting) {
      this.updateTouchSelection(event);
    }
  }

  handleTouchEnd(event: TouchEvent) {
    if (this._store.state.isSelecting) {
      if (this.isSelectionClick) {
        this.updateTouchSelection(event);
        this.addSelectedObjectAtIndexToSelectionGroup(0);
        this.removeSelectionBox();
      }

      if (this.isSelectionDrag) {
        this.updateTouchSelection(event);
        this.addSelectedObjectsToSelectionGroup();
        this.removeSelectionBox();
      }
    }
  }

  private removeSelectionBox(): void {
    this._store.state.selectionBox = null;
    this._store.state.isSelecting = false;
    this._store.state.objectsOctree.remove(o => o instanceof KrtizelSelectionBox);
    this._store.rerender();
  }

  private startMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._store.offsetX;
    clientY = event.clientY - this._store.offsetY;

    const selectionBox = new KrtizelSelectionBox(this._store);

    this.selectionStartX = (clientX - this._store.state.translateX) / this._store.state.scale;
    this.selectionStartY = (clientY - this._store.state.translateY) / this._store.state.scale;

    selectionBox.translateX = this.selectionStartX;
    selectionBox.translateY = this.selectionStartY;

    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = selectionBox;
    this._store.state.isSelecting = true;

    this._store.state.objectsOctree.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.objectsOctree.insert(selectionBox);
  }

  private startTouchSelection(event: TouchEvent): void {
    const firstTouch = event.touches[0];

    if(!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._store.offsetY);

    const selectionBox = new KrtizelSelectionBox(this._store);

    this.selectionStartX = (clientX - this._store.state.translateX) / this._store.state.scale;
    this.selectionStartY = (clientY - this._store.state.translateY) / this._store.state.scale;

    selectionBox.translateX = this.selectionStartX;
    selectionBox.translateY = this.selectionStartY;

    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = selectionBox;
    this._store.state.isSelecting = true;

    this._store.state.objectsOctree.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.objectsOctree.insert(selectionBox);
  }

  private updateMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._store.offsetX;
    clientY = event.clientY - this._store.offsetY;

    const selectionBox = this._store.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._store.state.translateY) / selectionBox.scale;

      selectionBox.width = Math.abs(currentX - this.selectionStartX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.selectionStartY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.selectionStartX);
      selectionBox.translateY = Math.min(currentY, this.selectionStartY);

      this.updateSelectedObjects();

      this._store.rerender();
    }
  }

  private updateTouchSelection(event: TouchEvent): void {
    const firstTouch = event.touches[0];

    if(!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._store.offsetY);

    const selectionBox = this._store.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._store.state.translateY) / selectionBox.scale;

      selectionBox.width = Math.abs(currentX - this.selectionStartX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.selectionStartY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.selectionStartX);
      selectionBox.translateY = Math.min(currentY, this.selectionStartY);

      this.updateSelectedObjects();

      this._store.rerender();
    }
  }

  private updateSelectedObjects(): void {
    this._store.allObjects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => {
        const objectPolygon = object.rotatedPolygon;
        const selectionBoxPolygon = this._store.state.selectionBox.rotatedPolygon;

        object.selected = KritzelGeometryHelper.doPolygonsIntersect(objectPolygon, selectionBoxPolygon);
      });
  }

  private addSelectedObjectAtIndexToSelectionGroup(index: number): void {
    const selectedObjects = this._store.selectedObjects.sort((a, b) => b.zIndex - a.zIndex);
    const selectedObject = selectedObjects[index];

    if (!selectedObject) {
      return;
    }

    selectedObjects.forEach(o => (o.selected = false));

    this._store.state.selectionGroup = new KritzelSelectionGroup(this._store);
    this._store.state.selectionGroup.addOrRemove(selectedObject);
    this._store.state.selectionGroup.selected = true;
    this._store.state.selectionGroup.rotation = this._store.state.selectionGroup.objects[0].rotation;

    this._store.history.executeCommand(new AddSelectionGroupCommand(this._store, this, this._store.state.selectionGroup));
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = this._store.selectedObjects;

    if (selectedObjects.length === 0) {
      return;
    }

    this._store.state.selectionGroup = new KritzelSelectionGroup(this._store);
    selectedObjects.forEach(o => {
      o.selected = false;
      this._store.state.selectionGroup.addOrRemove(o);
    });
    this._store.state.selectionGroup.selected = true;

    if (this._store.state.selectionGroup.length === 1) {
      this._store.state.selectionGroup.rotation = this._store.state.selectionGroup.objects[0].rotation;
    }

    this._store.history.executeCommand(new AddSelectionGroupCommand(this._store, this, this._store.state.selectionGroup));
  }
}
