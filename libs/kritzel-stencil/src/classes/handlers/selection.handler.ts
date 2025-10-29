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
    return this._core.store.state.selectionBox && this._core.store.state.selectionBox.width === 0 && this._core.store.state.selectionBox.height === 0;
  }

  get isSelectionDrag() {
    return this._core.store.state.selectionBox && (this._core.store.state.selectionBox.width > 0 || this._core.store.state.selectionBox.height > 0);
  }

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && !this._core.store.state.selectionGroup) {
        this.startMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.store.state.pointers.size === 1 && !this._core.store.state.isScaling && !this._core.store.state.selectionGroup) {
          this.startTouchSelection();
          this.updateTouchSelection();
        }
      }, 80);
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isSelecting) {
        this.updateMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

      const moveDeltaX = Math.abs(x - this.touchStartX);
      const moveDeltaY = Math.abs(y - this.touchStartY);
      const moveThreshold = 5;

      if ((moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) && this._core.store.state.isSelecting) {
        this.updateTouchSelection();

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const hasObjectsMoved = this._core.store.state.hasObjectsChanged;

        if (this._core.store.state.selectionGroup?.objects.length === 1 && hasObjectsMoved === false) {
          this._core.store.state.selectionGroup.objects[0].edit(event);
        }

        this._core.store.state.hasObjectsChanged = false;

        if (this._core.store.state.isSelecting) {
          if (this.isSelectionClick) {
            this.handleSelectionClick(event);
          }

          if (this.isSelectionDrag) {
            this.updateMouseSelection(event);
            this.addSelectedObjectsToSelectionGroup();
            this.removeSelectionBox();
          }
        }
      }
    }

    if (event.pointerType === 'touch') {
      clearTimeout(this.touchStartTimeout);

      const hasObjectsMoved = this._core.store.state.hasObjectsChanged;

      if (this._core.store.state.selectionGroup?.objects.length === 1 && hasObjectsMoved === false) {
        this._core.store.state.selectionGroup.objects[0].edit(event);
      }

      this._core.store.state.hasObjectsChanged = false;

      if (this._core.store.state.isSelecting) {
        if (this.isSelectionClick) {
          this.handleSelectionClick(event);
        }

        if (this.isSelectionDrag) {
          this.updateTouchSelection();
          this.addSelectedObjectsToSelectionGroup();
          this.removeSelectionBox();
        }

        this._core.store.state.skipContextMenu = false;
      }
    }
  }

  private removeSelectionBox(): void {
    this._core.store.state.selectionBox = null;
    this._core.store.state.isSelecting = false;
    this._core.store.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox);
  }

  private startMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = KrtizelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
    this.startY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.store.state.selectionGroup = null;
    this._core.store.state.selectionBox = selectionBox;
    this._core.store.state.isSelecting = true;

    this._core.store.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.store.state.objectsMap.insert(selectionBox);
  }

  private startTouchSelection(): void {
    const activePointers = Array.from(this._core.store.state.pointers.values());
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

    this.startX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
    this.startY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.store.state.selectionGroup = null;
    this._core.store.state.selectionBox = selectionBox;
    this._core.store.state.isSelecting  = true;

    this._core.store.state.objectsMap.remove(o => o instanceof KrtizelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.store.state.objectsMap.insert(selectionBox);
  }

  private updateMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = this._core.store.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.store.state.translateY) / selectionBox.scale;

      const width = Math.abs(currentX - this.startX) * selectionBox.scale;
      const height = Math.abs(currentY - this.startY) * selectionBox.scale;

      selectionBox.width = width;
      selectionBox.height = height;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  private updateTouchSelection(): void {
    const activePointers = Array.from(this._core.store.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

    const selectionBox = this._core.store.state.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.store.state.translateY) / selectionBox.scale;

      const width = Math.abs(currentX - this.startX) * selectionBox.scale;
      const height = Math.abs(currentY - this.startY) * selectionBox.scale;

      selectionBox.width = width;
      selectionBox.height = height;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  private updateSelectedObjects(): void {
    this._core.store.allObjects
      .filter(o => !(o instanceof KrtizelSelectionBox))
      .forEach(object => (object.isSelected = object.hitTestPolygon(this._core.store.state.selectionBox.rotatedPolygon)));
  }

  private handleSelectionClick(event: PointerEvent): void {
    const selectedObject = this.getTopmostHitObject(event);

    this.clearSelectionPreview();

    this.addObjectToSelectionGroup(selectedObject);
    this.removeSelectionBox();
  }

  private getTopmostHitObject(event: PointerEvent): KritzelBaseObject<any> | null {
    const pointerX = this._core.store.state.pointerX;
    const pointerY = this._core.store.state.pointerY;
    const overlappingObjects = this._core.getObjectsFromPointerEvent(event, '.object');

    for (const object of overlappingObjects) {
      if (object.hitTest(pointerX, pointerY)) {
        return object;
      }
    }

    return null;
  }

  private clearSelectionPreview(): void {
    this._core.store.allNonSelectionObjects.forEach(object => {
      object.isSelected = false;
    });
  }

  private addObjectToSelectionGroup(object: KritzelBaseObject): void {
    if (!object) {
      return;
    }

    object.isSelected = false;

    const selectionGroup = KritzelSelectionGroup.create(this._core);
    selectionGroup.addOrRemove(object);
    selectionGroup.isSelected = true;
    selectionGroup.rotation = object.rotation;

    this._core.commandManager.executeCommand(new AddSelectionGroupCommand(this._core, this, selectionGroup));
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = this._core.store.selectedObjects;

    if (selectedObjects.length === 0) {
      return;
    }

    this._core.store.state.selectionGroup = KritzelSelectionGroup.create(this._core);
    selectedObjects.forEach(o => {
      this._core.store.state.selectionGroup.addOrRemove(o);
      o.isSelected = false;
    });

    const selectionGroup = this._core.store.state.selectionGroup;
    selectionGroup.isSelected = true;

    if (selectionGroup.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this._core.commandManager.executeCommand(new AddSelectionGroupCommand(this._core, this, selectionGroup));
  }
}
