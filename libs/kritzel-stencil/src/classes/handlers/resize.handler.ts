import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { BatchCommand } from '../commands/batch.command';
import { ResizeSelectionGroupCommand } from '../commands/resize-selection-group.command';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;

  initialSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  newSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  unchangedObjects: KritzelBaseObject<any>[] = [];

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        if (this._core.store.state.selectionGroup && this._core.store.state.isResizeHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.setState('isResizing', true);
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = this._core.store.state.selectionGroup.width;
          this.initialSize.height = this._core.store.state.selectionGroup.height;
          this.initialSize.x = this._core.store.state.selectionGroup.translateX;
          this.initialSize.y = this._core.store.state.selectionGroup.translateY;

          this.unchangedObjects = this._core.store.state.selectionGroup.objects.map(obj => obj.clone());
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
        if (this._core.store.state.selectionGroup && this._core.store.state.isResizeHandleSelected) {
          const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
          const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

          this._core.store.setState('isResizing', true);
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = this._core.store.state.selectionGroup.width;
          this.initialSize.height = this._core.store.state.selectionGroup.height;
          this.initialSize.x = this._core.store.state.selectionGroup.translateX;
          this.initialSize.y = this._core.store.state.selectionGroup.translateY;

          this.unchangedObjects = this._core.store.state.selectionGroup.objects.map(obj => obj.clone());

          clearTimeout(this._core.store.state.longTouchTimeout);
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isResizing && this._core.store.state.selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
        }

        this._core.store.state.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const oneFingerTouch = activePointers[0];

      if (!oneFingerTouch) {
        return;
      }

      if (this._core.store.state.isResizing && this._core.store.state.selectionGroup) {
        const clientX = Math.round(oneFingerTouch.clientX - this._core.store.offsetX);
        const clientY = Math.round(oneFingerTouch.clientY - this._core.store.offsetY);

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height - dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = dy / this._core.store.state.scale + this.initialSize.y;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = dx / this._core.store.state.scale + this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + dx;
            this.newSize.height = this.initialSize.height + dy;
            this.newSize.x = this.initialSize.x;
            this.newSize.y = this.initialSize.y;
            break;
        }

        this._core.store.state.selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isResizing) {
        const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._core, this, structuredClone(this.initialSize), structuredClone(this.newSize));
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
          return new UpdateObjectCommand(this._core, this, unchangedObject, { ...object });
        });

        this.unchangedObjects = [];

        this._core.history.executeCommand(new BatchCommand(this._core, this, [resizeSelectionGroupCommand, ...updateObjectsCommand]));

        this._core.store.setState('isResizing', false);
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isResizing) {
        const resizeSelectionGroupCommand = new ResizeSelectionGroupCommand(this._core, this, structuredClone(this.initialSize), structuredClone(this.newSize));
        const updateObjectsCommand = this._core.store.state.selectionGroup.objects.map(object => {
          const unchangedObject = this.unchangedObjects.find(o => o.id === object.id);
          return new UpdateObjectCommand(this._core, this, unchangedObject, { ...object });
        });

        this.unchangedObjects = [];

        this._core.history.executeCommand(new BatchCommand(this._core, this, [resizeSelectionGroupCommand, ...updateObjectsCommand]));
        this._core.store.setState('isResizing', false);

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }
}
