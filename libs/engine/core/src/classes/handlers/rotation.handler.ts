import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelBaseHandler } from './base.handler';
import { KritzelCore } from '../core/core.class';

/**
 * Handles rotation interactions for selected objects on the canvas.
 * Supports both mouse and touch/pen input for rotating the selection group
 * around its center point.
 */
export class KritzelRotationHandler extends KritzelBaseHandler {
  /** The initial angle (in radians) between the cursor and the selection group center when rotation starts. */
  initialRotation: number = 0;

  /** The current rotation angle (in radians) applied to the selection group. */
  rotation: number = 0;

  /** The rotation value of the selection group before the current rotation operation began. */
  initialSelectionGroupRotation: number = 0;

  /** The X coordinate of the rotation pivot (group center) captured when rotation starts, in world space. */
  initialCenterX: number = 0;

  /** The Y coordinate of the rotation pivot (group center) captured when rotation starts, in world space. */
  initialCenterY: number = 0;

  /**
   * Creates an instance of KritzelRotationHandler.
   * @param core - The KritzelCore instance that provides access to the store, engine, and other core functionalities.
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Resets the rotation state to initial values.
   * Called after a rotation operation is completed.
   */
  private reset() {
    this.initialRotation = 0;
    this.rotation = 0;
    this.initialCenterX = 0;
    this.initialCenterY = 0;
  }

  /**
   * Handles the pointer down event to initiate a rotation operation.
   * Calculates the initial angle between the cursor position and the selection group center.
   * Supports both mouse (left-click) and touch/pen input.
   * @param event - The PointerEvent containing information about the pointer interaction.
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup && this._core.store.state.isRotationHandleSelected) {
          selectionGroup.beginTransform();

          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.state.isRotating = true;

          const objectScale = selectionGroup.scale || 1;
          const centerX = selectionGroup.translateX + selectionGroup.width / 2 / objectScale;
          const centerY = selectionGroup.translateY + selectionGroup.height / 2 / objectScale;

          // Capture the pivot once so it stays fixed even if the bounding box grows
          // mid-rotation (e.g. a line anchored to an object outside the selection).
          this.initialCenterX = centerX;
          this.initialCenterY = centerY;

          const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
          const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

          this.initialSelectionGroupRotation = selectionGroup.rotation;
          this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - selectionGroup.rotation;
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      if (activePointers.length === 1) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup && this._core.store.state.isRotationHandleSelected) {
          selectionGroup.beginTransform();

          const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
          const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

          this._core.store.state.isRotating = true;

          const objectScale = selectionGroup.scale || 1;
          const centerX = selectionGroup.translateX + selectionGroup.width / 2 / objectScale;
          const centerY = selectionGroup.translateY + selectionGroup.height / 2 / objectScale;

          // Capture the pivot once so it stays fixed even if the bounding box grows
          // mid-rotation (e.g. a line anchored to an object outside the selection).
          this.initialCenterX = centerX;
          this.initialCenterY = centerY;

          const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
          const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

          this.initialSelectionGroupRotation = selectionGroup.rotation;
          this.initialRotation = Math.atan2(centerY - cursorY, centerX - cursorX) - selectionGroup.rotation;

          const timeout = this._core.store.state.longTouchTimeout;

          if(timeout) {
            globalThis.clearTimeout?.(timeout);
          }
        }
      }
    }
  }

  /**
   * Handles the pointer move event during an active rotation operation.
   * Calculates the current rotation angle based on the cursor position relative
   * to the selection group center and applies the rotation to the selection group.
   * @param event - The PointerEvent containing the current pointer position.
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isRotating && selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        const groupCenterX = this.initialCenterX;
        const groupCenterY = this.initialCenterY;

        const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
        const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

        const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

        this.rotation = currentRotation - this.initialRotation;

        selectionGroup.rotate(this.rotation);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const firstTouch = activePointers[0];

      if (!firstTouch) {
        return;
      }

      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isRotating && selectionGroup) {
        const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
        const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

        const groupCenterX = this.initialCenterX;
        const groupCenterY = this.initialCenterY;

        const cursorX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
        const cursorY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

        const currentRotation = Math.atan2(groupCenterY - cursorY, groupCenterX - cursorX);

        this.rotation = currentRotation - this.initialRotation;

        selectionGroup.rotate(this.rotation);

        const timeout = this._core.store.state.longTouchTimeout;

        if (timeout) {
          globalThis.clearTimeout?.(timeout);
        }
      }
    }
  }

  /**
   * Handles the pointer up event to finalize the rotation operation.
   * Updates the selection group state, emits the objects change event,
   * resets the rotation state, and marks objects as changed.
   * @param event - The PointerEvent indicating the end of the pointer interaction.
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isRotating) {
        this._core.store.selectionGroup!.update();
        this._core.engine.emitObjectsChange();
        this._core.store.state.isRotating = false;
        this._core.store.state.hasObjectsChanged = true;
        this._core.store.objects.stopUndoCapturing();

        this.reset();
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isRotating) {
        this._core.store.selectionGroup!.update();
        this._core.engine.emitObjectsChange();
        this._core.store.state.isRotating = false;
        this._core.store.state.hasObjectsChanged = true;
        this._core.store.objects.stopUndoCapturing();

        this.reset();

        const timeout = this._core.store.state.longTouchTimeout;

        if (timeout) {
          globalThis.clearTimeout?.(timeout);
        }
      }
    }
  }
}
