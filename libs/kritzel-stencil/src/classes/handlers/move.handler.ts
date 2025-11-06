import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  startX: number;
  startY: number;

  endX: number;
  endY: number;

  hasMoved: boolean = false;
  private trackedPointerId: number | null = null;

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
    this.trackedPointerId = null;
  }

  cancelPendingDrag(): void {
    this._core.store.state.isDragging = false;
    this.reset();
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.yjsManager.transaction(() => {
            selectionGroup.objects.forEach(object => {
              this._core.store.state.objectsMap.update(object);
            });
          });

          this._core.store.state.isDragging = true;
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.startX = this.dragStartX;
          this.startY = this.dragStartY;
          this.trackedPointerId = event.pointerId;
        } else {
          this.trackedPointerId = null;
        }
      } else {
        this.trackedPointerId = null;
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.pointers.size === 1) {
        if (this._core.store.state.isScaling) {
          this.trackedPointerId = null;
          return;
        }

        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected) {
          const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

          this.dragStartX = x;
          this.dragStartY = y;
          this.startX = x;
          this.startY = y;
          this.trackedPointerId = event.pointerId;
        } else {
          this.trackedPointerId = null;
        }
      }
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (this.trackedPointerId === null || this.trackedPointerId !== event.pointerId) {
      return;
    }

    if (event.pointerType === 'mouse') {
      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isDragging && selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        this.endX = clientX;
        this.endY = clientY;

        const moveDeltaX = Math.abs(clientX - this.startX);
        const moveDeltaY = Math.abs(clientY - this.startY);
        const moveThreshold = 5;

        if (moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          // Disable Yjs sync during move to prevent history pollution
          this._core.store.state.objectsMap.setSyncEnabled(false);

          selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);
          selectionGroup.objects.forEach(object => {
            this._core.store.state.objectsMap.update(object);
          });

          this._core.store.state.objectsMap.setSyncEnabled(true);

          this._core.rerender();
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.hasMoved = true;
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const selectionGroup = this._core.store.selectionGroup;

      if (
        this._core.store.state.pointers.size === 1 &&
        selectionGroup &&
        !this._core.store.state.isResizeHandleSelected &&
        !this._core.store.state.isRotationHandleSelected &&
        !this._core.store.state.isScaling
      ) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.store.state.isDragging = true;
        this.endX = x;
        this.endY = y;

        const moveDeltaX = Math.abs(x - this.startX);
        const moveDeltaY = Math.abs(y - this.startY);
        const moveThreshold = 5;

        if (moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          clearTimeout(this._core.store.state.longTouchTimeout);

          // Disable Yjs sync during move to prevent history pollution
          this._core.store.state.objectsMap.setSyncEnabled(false);

          selectionGroup.move(x, y, this.dragStartX, this.dragStartY);
          selectionGroup.objects.forEach(object => {
            this._core.store.state.objectsMap.update(object);
          });

          this._core.store.state.objectsMap.setSyncEnabled(true);

          this._core.rerender();
          this.dragStartX = x;
          this.dragStartY = y;
          this.hasMoved = true;
        }
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (this.trackedPointerId === null || this.trackedPointerId !== event.pointerId) {
      return;
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging) {
        this._core.store.state.isDragging = false;

        if (this.hasMoved) {
          // Objects have already been moved during handlePointerMove
          const selectionGroup = this._core.store.selectionGroup;
          if (selectionGroup) {
            this._core.yjsManager.transaction(() => {
              selectionGroup.objects.forEach(object => {
                this._core.store.state.objectsMap.update(object);
              });
            });
          }
          this._core.store.state.hasObjectsChanged = true;
          this._core.rerender();
        }
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDragging) {
        this._core.store.state.isDragging = false;

        if (this.hasMoved) {
          const selectionGroup = this._core.store.selectionGroup;
          if (selectionGroup) {
            selectionGroup.objects.forEach(object => {
              this._core.store.state.objectsMap.update(object);
            });
          }
          this._core.store.state.hasObjectsChanged = true;
          this._core.rerender();
        }
      }
    }

    this.reset();
  }
}
