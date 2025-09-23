import { KritzelEventHelper } from '../../helpers/event.helper';
import { AddSelectionGroupCommand } from '../commands/add-selection-group.command';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelCore } from '../core/core.class';

export class KritzelSelectionHandler extends KritzelBaseHandler {
  startX: number;
  startY: number;

  touchStartX: number = 0;
  touchStartY: number = 0;

  touchStartTimeout: any = null;

  get isSelectionClick() {
    return this._core.state.selectionBox && this._core.state.selectionBox.width === 0 && this._core.state.selectionBox.height === 0;
  }

  get isSelectionDrag() {
    return this._core.state.selectionBox && (this._core.state.selectionBox.width > 0 || this._core.state.selectionBox.height > 0);
  }

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && !this._core.state.selectionGroup) {
        this.startMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.state.pointers.size === 1 && !this._core.state.isScaling && !this._core.state.selectionGroup) {
          this.startTouchSelection();
          this.updateTouchSelection();
        }
      }, 80);
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.state.isSelecting) {
        this.updateMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.state.pointers.values());

      const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

      const moveDeltaX = Math.abs(x - this.touchStartX);
      const moveDeltaY = Math.abs(y - this.touchStartY);
      const moveThreshold = 5;

      if ((moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) && this._core.state.isSelecting) {
        this.updateTouchSelection();

        clearTimeout(this._core.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && this._core.state.isSelecting) {
        if (this.isSelectionClick) {
          const x = this._core.state.pointerX;
          const y = this._core.state.pointerY;
          const selectedObject = this._core.getObjectsFromPointerEvent(event, '.object').find(obj => obj.hitTest(x, y));

          this.addObjectToSelectionGroup(selectedObject);
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

      if (this._core.state.isSelecting) {
        if (this.isSelectionClick) {
          const x = this._core.state.pointerX;
          const y = this._core.state.pointerY;
          const selectedObject = this._core.getObjectsFromPointerEvent(event, '.object').find(obj => obj.hitTest(x, y));

          this.addObjectToSelectionGroup(selectedObject);
          this.removeSelectionBox();
        }

        if (this.isSelectionDrag) {
          this.updateTouchSelection();
          this.addSelectedObjectsToSelectionGroup();
          this.removeSelectionBox();
        }

        this._core.state.skipContextMenu = false;
      }
    }
  }

  private removeSelectionBox(): void {
    this._core.state.selectionBox = null;
    this._core.state.isSelecting = false;
    this._core.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox);
    this._core.rerender();
  }

  private startMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = KrtizelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.state.translateX) / this._core.state.scale;
    this.startY = (clientY - this._core.state.translateY) / this._core.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.state.selectionGroup = null;
    this._core.state.selectionBox = selectionBox;
    this._core.state.isSelecting = true;

    this._core.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.state.objectsMap.insert(selectionBox);
  }

  private startTouchSelection(): void {
    const activePointers = Array.from(this._core.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);
    this.touchStartX = clientX;
    this.touchStartY = clientY;

    const selectionBox = KrtizelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.state.translateX) / this._core.state.scale;
    this.startY = (clientY - this._core.state.translateY) / this._core.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.state.selectionGroup = null;
    this._core.state.selectionBox = selectionBox;
    this._core.state.isSelecting = true;

    this._core.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.state.objectsMap.insert(selectionBox);
  }

  private updateMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = this._core.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.state.translateY) / selectionBox.scale;

      selectionBox.width = Math.abs(currentX - this.startX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.startY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      this.updateSelectedObjects();

      this._core.rerender();
    }
  }

  private updateTouchSelection(): void {
    const activePointers = Array.from(this._core.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

    const selectionBox = this._core.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.state.translateY) / selectionBox.scale;

      selectionBox.width = Math.abs(currentX - this.startX) * selectionBox.scale;
      selectionBox.height = Math.abs(currentY - this.startY) * selectionBox.scale;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      this.updateSelectedObjects();
    }
  }

  private updateSelectedObjects(): void {
    this._core.store.allObjects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => (object.isSelected = object.hitTestPolygon(this._core.state.selectionBox.rotatedPolygon)));
  }

  private addObjectToSelectionGroup(object: KritzelBaseObject): void {
    if (!object) {
      return;
    }

    this._core.state.selectionGroup = KritzelSelectionGroup.create(this._core);
    this._core.state.selectionGroup.addOrRemove(object);
    this._core.state.selectionGroup.isSelected = true;
    this._core.state.selectionGroup.rotation = object.rotation;

    this._core.history.executeCommand(new AddSelectionGroupCommand(this._core, this, this._core.state.selectionGroup));
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = this._core.store.selectedObjects;

    if (selectedObjects.length === 0) {
      return;
    }

    this._core.state.selectionGroup = KritzelSelectionGroup.create(this._core);
    selectedObjects.forEach(o => {
      o.isSelected = false;
      this._core.state.selectionGroup.addOrRemove(o);
    });
    this._core.state.selectionGroup.isSelected = true;

    if (this._core.state.selectionGroup.length === 1) {
      this._core.state.selectionGroup.rotation = this._core.state.selectionGroup.objects[0].rotation;
    }

    this._core.history.executeCommand(new AddSelectionGroupCommand(this._core, this, this._core.state.selectionGroup));
  }
}
