import { KritzelEventHelper } from '../../helpers/event.helper';
import { MoveSelectionGroupCommand } from '../commands/move-selection-group.command';
import { KritzelBaseHandler } from './base.handler';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { BatchCommand } from '../commands/batch.command';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';

export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  startX: number;
  startY: number;

  endX: number;
  endY: number;

  hasMoved: boolean = false;

  unchangedObjects: KritzelBaseObject<any>[] = [];

  constructor(core: KritzelCore) {
    super(core);
  }

  private reset() {
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.startX = 0;
    this.startY = 0;
    this.endX = 0;
    this.endY = 0;
    this.hasMoved = false;
    this.unchangedObjects = [];
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        if (this._core.store.state.selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.setState('isDragging', true);
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.startX = this.dragStartX;
          this.startY = this.dragStartY;

          this.unchangedObjects = this._core.store.state.selectionGroup.objects.map(obj => obj.clone());
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.pointers.size === 1) {
        if (this._core.store.state.selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

          this.dragStartX = x;
          this.dragStartY = y;
          this.startX = x;
          this.startY = y;

          this.unchangedObjects = this._core.store.state.selectionGroup.objects.map(obj => obj.clone());
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging && this._core.store.state.selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        this.endX = clientX;
        this.endY = clientY;
        this._core.store.state.selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.hasMoved = true;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (
        this._core.store.state.pointers.size === 1 &&
        this._core.store.state.selectionGroup &&
        !this._core.store.state.isResizeHandleSelected &&
        !this._core.store.state.isRotationHandleSelected
      ) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.store.setState('isDragging', true);
        this.endX = x;
        this.endY = y;
        this.hasMoved = true;

        const moveDeltaX = Math.abs(x - this.startX);
        const moveDeltaY = Math.abs(y - this.startY);
        const moveThreshold = 5;

        if (moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          clearTimeout(this._core.store.state.longTouchTimeout);

          this._core.store.state.selectionGroup.move(x, y, this.dragStartX, this.dragStartY);
          this.dragStartX = x;
          this.dragStartY = y;
        }
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging) {
        this._core.store.setState('isDragging', false);

        if (this.hasMoved) {
          const moveSelectionGroupCommand = new MoveSelectionGroupCommand(this._core, this, this.endX, this.endY, this.startX, this.startY, true);
          const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
            const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
            return new UpdateObjectCommand(this._core, this, unchangedObject, {
              translateX: object.translateX,
              translateY: object.translateY,
            });
          });

          this._core.history.executeCommand(new BatchCommand(this._core, this, [moveSelectionGroupCommand, ...updateObjectsCommand]));
        }

        this.reset();
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDragging) {
        this._core.store.setState('isDragging', false);

        if (this.hasMoved) {
          const moveSelectionGroupCommand = new MoveSelectionGroupCommand(this._core, this, this.endX, this.endY, this.startX, this.startY, true);
          const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
            const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
            return new UpdateObjectCommand(this._core, this, unchangedObject, {
              translateX: object.translateX,
              translateY: object.translateY,
            });
          });

          this._core.history.executeCommand(new BatchCommand(this._core, this, [moveSelectionGroupCommand, ...updateObjectsCommand]));
        }

        this.reset();
      }
    }
  }
}
