import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelStore } from '../store.class';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelSelectionHandler extends KritzelBaseHandler {
  startX: number;
  startY: number;

  touchStartX: number = 0;
  touchStartY: number = 0;

  touchStartTimeout: any = null;

  get isSelectionClick() {
    return this._store.state.selectionBox && this._store.state.selectionBox.width === 0 && this._store.state.selectionBox.height === 0;
  }

  get isSelectionDrag() {
    return this._store.state.selectionBox && (this._store.state.selectionBox.width > 0 || this._store.state.selectionBox.height > 0);
  }

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && !this._store.state.selectionGroup) {
        this.startMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._store.state.pointers.size === 1 && !this._store.state.isScaling && !this._store.state.selectionGroup) {
          this.startTouchSelection();
          this.updateTouchSelection();
        }
      }, 80);
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isSelecting) {
        this.updateMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._store.state.pointers.values());

      const x = Math.round(activePointers[0].clientX - this._store.offsetX);
      const y = Math.round(activePointers[0].clientY - this._store.offsetY);

      const moveDeltaX = Math.abs(x - this.touchStartX);
      const moveDeltaY = Math.abs(y - this.touchStartY);
      const moveThreshold = 5;

      if ((moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) && this._store.state.isSelecting) {
        this.updateTouchSelection();

        clearTimeout(this._store.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && this._store.state.isSelecting) {
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

    if (event.pointerType === 'touch') {
      clearTimeout(this.touchStartTimeout);

      if (this._store.state.isSelecting) {
        if (this.isSelectionClick) {
          this.updateTouchSelection();
          this.addSelectedObjectAtIndexToSelectionGroup(0);
          this.removeSelectionBox();
        }

        if (this.isSelectionDrag) {
          this.updateTouchSelection();
          this.addSelectedObjectsToSelectionGroup();
          this.removeSelectionBox();
        }

        this._store.state.skipContextMenu = false;
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

    const selectionBox = KrtizelSelectionBox.create(this._store);

    this.startX = (clientX - this._store.state.translateX) / this._store.state.scale;
    this.startY = (clientY - this._store.state.translateY) / this._store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = selectionBox;
    this._store.state.isSelecting = true;

    this._store.state.objectsOctree.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._store.state.objectsOctree.insert(selectionBox);
  }

  private startTouchSelection(): void {
    const activePointers = Array.from(this._store.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._store.offsetY);
    this.touchStartX = clientX;
    this.touchStartY = clientY;

    const selectionBox = KrtizelSelectionBox.create(this._store);

    this.startX = (clientX - this._store.state.translateX) / this._store.state.scale;
    this.startY = (clientY - this._store.state.translateY) / this._store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

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

      selectionBox.width = Math.abs(currentX - this.startX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.startY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      this.updateSelectedObjects();

      this._store.rerender();
    }
  }

  private updateTouchSelection(): void {
    const activePointers = Array.from(this._store.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._store.offsetY);

    const selectionBox = this._store.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._store.state.translateY) / selectionBox.scale;

      selectionBox.width = Math.abs(currentX - this.startX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.startY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      this.updateSelectedObjects();
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

    this._store.state.selectionGroup = KritzelSelectionGroup.create(this._store);
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

    this._store.state.selectionGroup = KritzelSelectionGroup.create(this._store);
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
