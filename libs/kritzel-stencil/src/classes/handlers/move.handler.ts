import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';

/** Threshold in screen pixels for disconnecting anchored lines during drag */
const ANCHOR_DISCONNECT_THRESHOLD = 30;

/**
 * Handler class responsible for managing move/drag operations on selected objects.
 * Handles pointer events for mouse, touch, and pen inputs to enable dragging
 * of selected objects on the canvas. Also manages anchor disconnection when
 * lines are dragged beyond a threshold distance.
 */
export class KritzelMoveHandler extends KritzelBaseHandler {
  /** X coordinate where the drag started (updates during drag for incremental movement) */
  dragStartX: number = 0;
  /** Y coordinate where the drag started (updates during drag for incremental movement) */
  dragStartY: number = 0;

  /** Initial X coordinate when starting interaction (remains constant during drag) */
  startX: number = 0;
  /** Initial Y coordinate when starting interaction (remains constant during drag) */
  startY: number = 0;

  /** Current X coordinate during move operation */
  endX: number = 0;
  /** Current Y coordinate during move operation */
  endY: number = 0;

  /** Initial position when drag started (for calculating total accumulated distance) */
  private initialDragX: number = 0;
  private initialDragY: number = 0;

  /** Set of line IDs that have been disconnected from anchors during this drag */
  private disconnectedLineIds: Set<string> = new Set();

  /** Flag indicating whether objects have been moved during the current drag operation */
  hasMoved: boolean = false;
  /** The pointer ID being tracked for the current drag operation (null if not dragging) */
  private trackedPointerId: number | null = null;

  /**
   * Creates a new instance of KritzelMoveHandler.
   * @param core - The KritzelCore instance providing access to store, engine, and other core services
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Resets all internal state variables to their initial values.
   * Called after a drag operation completes or is cancelled to prepare
   * the handler for the next interaction.
   * @returns void
   */
  private reset(): void {
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

  /**
   * Cancels any pending drag operation without completing it.
   * Sets the dragging state to false and resets internal state.
   * Useful for aborting a drag when another interaction takes precedence.
   * @returns void
   */
  cancelPendingDrag(): void {
    this._core.store.state.isDragging = false;
    this.reset();
  }

  /**
   * Handles the pointer down event to initiate a drag operation.
   * Validates that the event is appropriate for starting a drag (e.g., left mouse click,
   * single touch, correct state) and initializes drag tracking variables.
   * Supports mouse, touch, and pen input types.
   * @param event - The PointerEvent from the browser containing pointer information
   *                including clientX, clientY, pointerId, pointerType, and modifier keys
   * @returns void
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const selectionGroup = this._core.store.selectionGroup;
        const isAdditive = event.shiftKey || event.ctrlKey;
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected && !this._core.store.state.isLineHandleSelected && !isAdditive) {
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

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.pointers.size === 1) {
        if (this._core.store.state.isScaling) {
          this.trackedPointerId = null;
          return;
        }

        const selectionGroup = this._core.store.selectionGroup;
        const isAdditive = event.shiftKey || event.ctrlKey;
        if (selectionGroup?.isSelected && !this._core.store.state.isResizeHandleSelected && !this._core.store.state.isRotationHandleSelected && !this._core.store.state.isLineHandleSelected && !isAdditive) {
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

  /**
   * Handles pointer move events during a drag operation.
   * Calculates movement delta, applies a movement threshold to filter micro-movements,
   * checks for anchor disconnection on lines, and updates the position of selected objects.
   * Supports mouse, touch, and pen input types.
   * @param event - The PointerEvent from the browser containing current pointer position
   *                and pointer identification (pointerId, pointerType, clientX, clientY)
   * @returns void
   */
  handlePointerMove(event: PointerEvent): void {
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

        if (this.hasMoved || moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          // Check for anchor disconnect threshold on lines
          this.checkAndDisconnectAnchors(clientX, clientY);

          selectionGroup.move(clientX, clientY, this.dragStartX, this.dragStartY);

          this.dragStartX = clientX;
          this.dragStartY = clientY;
          this.hasMoved = true;
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
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

        if (this.hasMoved || moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) {
          const timeout = this._core.store.state.longTouchTimeout;

          if(timeout) {
            globalThis.clearTimeout?.(timeout);
          }

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

  /**
   * Handles the pointer up event to complete a drag operation.
   * Finalizes the move by updating the selection group, emitting change events
   * if objects were moved, and resetting internal state for the next operation.
   * Supports mouse, touch, and pen input types.
   * @param event - The PointerEvent from the browser containing pointer identification
   *                (pointerId, pointerType) to verify this is the tracked pointer
   * @returns void
   */
  handlePointerUp(event: PointerEvent): void {
    if (this.trackedPointerId === null || this.trackedPointerId !== event.pointerId) {
      return;
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDragging) {
        this._core.store.state.isDragging = false;

        if (this.hasMoved) {
          this._core.store.selectionGroup!.persistChildren();
          this._core.store.selectionGroup!.refreshObjectDimensions(undefined, false);
          this._core.store.selectionGroup!.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
          this._core.store.objects.stopUndoCapturing();
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isDragging) {
        this._core.store.state.isDragging = false;

        if (this.hasMoved) {
          this._core.store.selectionGroup!.persistChildren();
          this._core.store.selectionGroup!.refreshObjectDimensions(undefined, false);
          this._core.store.selectionGroup!.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
          this._core.store.objects.stopUndoCapturing();
        }
      }
    }

    this.reset();
  }

  /**
   * Checks if the total accumulated drag distance exceeds the anchor disconnect threshold.
   * If so, disconnects all anchors from any KritzelLine objects in the selection group.
   * This allows anchored lines to be freely moved after dragging beyond the threshold.
   * 
   * Only disconnects anchors when the selection contains exclusively line objects.
   * If the selection includes other object types (e.g., shapes that lines might be
   * anchored to), no disconnection occurs to preserve intended relationships.
   * 
   * @param currentX - The current X coordinate of the pointer in screen pixels
   * @param currentY - The current Y coordinate of the pointer in screen pixels
   * @returns void
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

    // Only disconnect lines if the selection group contains ONLY lines.
    // If moving lines with other objects (e.g. shapes they might be anchored to), prevent auto-disconnect.
    // Cache objects once to avoid repeated getter calls
    const children = selectionGroup.objects;
    const onlyLines = children.every(obj => obj instanceof KritzelLine);
    if (!onlyLines) {
      return;
    }

    // Find and disconnect anchors from all anchored lines in the selection
    for (const obj of children) {
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
          this._core.store.objects.update(line);
        }
      }
    }
  }
}
