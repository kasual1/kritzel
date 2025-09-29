import { KritzelEventHelper } from '../../helpers/event.helper';
import { RotateSelectionGroupCommand } from '../commands/rotate-selection-group.command';
import { KritzelBaseHandler } from './base.handler';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { BatchCommand } from '../commands/batch.command';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelReviver } from '../core/reviver.class';

export class KritzelRotationHandler extends KritzelBaseHandler {
  initialRotation: number = 0;

  rotation: number = 0;

  unchangedObjects: KritzelBaseObject<any>[] = [];

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        if (this._core.store.state.selectionGroup && this._core.store.state.isRotationHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.setState('isRotating', true);

          const centerX = this._core.store.state.selectionGroup.translateX + this._core.store.state.selectionGroup.width / 2 / this._core.store.state.scale;
          const centerY = this._core.store.state.selectionGroup.translateY + this._core.store.state.selectionGroup.height / 2 / this._core.store.state.scale;

          const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
          const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

          this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - this._core.store.state.selectionGroup.rotation;

          this.unchangedObjects = ObjectHelper.clone(this._core.store.state.selectionGroup.objects);
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      if (activePointers.length === 1) {
        if (this._core.store.state.selectionGroup && this._core.store.state.isRotationHandleSelected) {
          const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
          const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

          this._core.store.setState('isRotating', true);

          const centerX = this._core.store.state.selectionGroup.translateX + this._core.store.state.selectionGroup.width / 2 / this._core.store.state.scale;
          const centerY = this._core.store.state.selectionGroup.translateY + this._core.store.state.selectionGroup.height / 2 / this._core.store.state.scale;

          const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
          const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

          this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - this._core.store.state.selectionGroup.rotation;

          this.unchangedObjects = ObjectHelper.clone(this._core.store.state.selectionGroup.objects);

          clearTimeout(this._core.store.state.longTouchTimeout);
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isRotating && this._core.store.state.selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        const groupCenterX = this._core.store.state.selectionGroup.translateX + this._core.store.state.selectionGroup.width / 2 / this._core.store.state.scale;
        const groupCenterY = this._core.store.state.selectionGroup.translateY + this._core.store.state.selectionGroup.height / 2 / this._core.store.state.scale;

        const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
        const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

        const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

        this.rotation = currentRotation - this.initialRotation;

        this._core.store.state.selectionGroup.rotate(this.rotation);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      if (this._core.store.state.isRotating && this._core.store.state.selectionGroup) {
        const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
        const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

        const groupCenterX = this._core.store.state.selectionGroup.translateX + this._core.store.state.selectionGroup.width / 2 / this._core.store.state.scale;
        const groupCenterY = this._core.store.state.selectionGroup.translateY + this._core.store.state.selectionGroup.height / 2 / this._core.store.state.scale;

        const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
        const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

        const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

        this.rotation = currentRotation - this.initialRotation;

        this._core.store.state.selectionGroup.rotate(this.rotation);

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isRotating) {
        const reviver = new KritzelReviver(this._core);
        const rotateSelectionGroupCommand = new RotateSelectionGroupCommand(this._core, this, this.rotation);
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
          const revivedObject = reviver.revive<KritzelBaseObject<any>>(unchangedObject);
          return new UpdateObjectCommand(this._core, this, revivedObject, {
            rotation: object.rotation,
            translateX: object.translateX,
            translateY: object.translateY,
          });
        });

        this.unchangedObjects = [];

        this._core.history.executeCommand(new BatchCommand(this._core, this, [rotateSelectionGroupCommand, ...updateObjectsCommand]));

        this._core.store.setState('isRotating', false);

        this.initialRotation = 0;
        this.rotation = 0;
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isRotating) {
        const reviver = new KritzelReviver(this._core);
        const rotateSelectionGroupCommand = new RotateSelectionGroupCommand(this._core, this, this.rotation);
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
          const revivedObject = reviver.revive<KritzelBaseObject<any>>(unchangedObject);
          return new UpdateObjectCommand(this._core, this, revivedObject, {
            rotation: object.rotation,
          });
        });

        this.unchangedObjects = [];

        this._core.history.executeCommand(new BatchCommand(this._core, this, [rotateSelectionGroupCommand, ...updateObjectsCommand]));

        this._core.store.setState('isRotating', false);

        this.initialRotation = 0;
        this.rotation = 0;

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }
}
