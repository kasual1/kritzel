import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';

/** Threshold in screen pixels for disconnecting anchored lines during drag */
const ANCHOR_DISCONNECT_THRESHOLD = 30;

export class KritzelMoveHandler extends KritzelBaseHandler {
  dragStartX: number;
  dragStartY: number;

  startX: number;
  startY: number;

  endX: number;
  endY: number;

  /** Initial position when drag started (for calculating total accumulated distance) */
  private initialDragX: number = 0;
  private initialDragY: number = 0;

  /** Set of line IDs that have been disconnected from anchors during this drag */
  private disconnectedLineIds: Set<string> = new Set();

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
    this.initialDragX = 0;
    this.initialDragY = 0;
    this.disconnectedLineIds.clear();
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
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected && !this._core.store.state.isLineHandleSelected) {
          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.state.isDragging = true;
          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.startX = this.dragStartX;
          this.startY = this.dragStartY;
          this.initialDragX = clientX;
          this.initialDragY = clientY;
          this.disconnectedLineIds.clear();
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
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected && !this._core.store.state.isLineHandleSelected) {
          const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

          this.dragStartX = x;
          this.dragStartY = y;
          this.startX = x;
          this.startY = y;
          this.initialDragX = x;
          this.initialDragY = y;
          this.disconnectedLineIds.clear();
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
          // Check for anchor disconnect threshold on lines
          this.checkAndDisconnectAnchors(clientX, clientY);

          selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);

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

          // Check for anchor disconnect threshold on lines
          this.checkAndDisconnectAnchors(x, y);

          selectionGroup.move(x, y, this.dragStartX, this.dragStartY);

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
          this._core.store.selectionGroup.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
        }
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDragging) {
        this._core.store.state.isDragging = false;

        if (this.hasMoved) {
          this._core.store.selectionGroup.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
        }
      }
    }

    this.reset();
  }

  /**
   * Checks if the total accumulated drag distance exceeds the anchor disconnect threshold.
   * If so, disconnects all anchors from any KritzelLine objects in the selection group.
   * This allows anchored lines to be freely moved after dragging beyond the threshold.
   */
  private checkAndDisconnectAnchors(currentX: number, currentY: number): void {
    const totalDeltaX = currentX - this.initialDragX;
    const totalDeltaY = currentY - this.initialDragY;
    const totalDistance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);

    if (totalDistance < ANCHOR_DISCONNECT_THRESHOLD) {
      return;
    }

    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup) {
      return;
    }

    // Find and disconnect anchors from all anchored lines in the selection
    for (const obj of selectionGroup.objects) {
      // Skip if already disconnected in this drag session
      if (this.disconnectedLineIds.has(obj.id)) {
        continue;
      }

      // Check if this is a line with anchors
      if (obj instanceof KritzelLine) {
        const line = obj;
        const hasAnchors = line.startAnchor || line.endAnchor;

        if (hasAnchors) {
          // Disconnect both anchors
          if (line.startAnchor) {
            this._core.anchorManager.removeAnchor(line.id, 'start');
          }
          if (line.endAnchor) {
            this._core.anchorManager.removeAnchor(line.id, 'end');
          }

          // Mark as disconnected so we don't try again
          this.disconnectedLineIds.add(line.id);

          // Update the line to persist the change
          this._core.store.state.objects.update(line);
        }
      }
    }
  }
}
