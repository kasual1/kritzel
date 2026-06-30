import { KritzelHandleType } from '../../enums/handle-type.enum';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelCore } from '../core/core.class';
import { KritzelBaseHandler } from './base.handler';

/**
 * Handler class responsible for managing resize operations on selected objects.
 * Supports mouse, touch, and pen input types, with rotation-aware resizing
 * and optional aspect ratio locking via Shift key (mouse only).
 */
export class KritzelResizeHandler extends KritzelBaseHandler {
  /** Initial mouse/pointer X coordinate when resize started */
  initialMouseX: number = 0;
  /** Initial mouse/pointer Y coordinate when resize started */
  initialMouseY: number = 0;

  /** Initial position and dimensions of the selection group before resize */
  initialSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  /** New position and dimensions being calculated during resize */
  newSize: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  /** Flag indicating whether the user has moved past the resize threshold */
  hasResized: boolean = false;

  /**
   * Creates a new KritzelResizeHandler instance.
   * @param core - The KritzelCore instance providing access to store, engine, and other core functionalities
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Resets all internal state variables to their default values.
   * Called after a resize operation completes to prepare for the next resize.
   * @private
   */
  private reset() {
    this.initialMouseX = 0;
    this.initialMouseY = 0;
    this.initialSize = { x: 0, y: 0, width: 0, height: 0 };
    this.newSize = { x: 0, y: 0, width: 0, height: 0 };
    this.hasResized = false;
  }

  /**
   * Rebase pointer and size baselines to the latest live selection bounds.
   * This prevents drift when anchored lines to external objects expand/shrink
   * the selection box while a resize gesture is in progress.
   */
  private rebaseResizeBaseline(
    selectionGroup: { width: number; height: number; translateX: number; translateY: number },
    clientX: number,
    clientY: number
  ): void {
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;
    this.initialSize.width = selectionGroup.width;
    this.initialSize.height = selectionGroup.height;
    this.initialSize.x = selectionGroup.translateX;
    this.initialSize.y = selectionGroup.translateY;
  }

  private shouldRebaseResizeBaseline(selectionGroup: { hasExternalAnchoredLineConnections?: () => boolean }): boolean {
    return selectionGroup.hasExternalAnchoredLineConnections?.() === true;
  }

  /**
   * Handles the pointer down event to initiate a resize operation.
   * Captures the initial mouse position and selection group dimensions when
   * the user clicks/touches a resize handle. Supports both mouse and touch/pen inputs.
   *
   * For mouse: Requires left click on an active resize handle.
   * For touch/pen: Requires single finger touch on an active resize handle.
   *
   * @param event - The PointerEvent containing pointer type, position, and button information
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup && this._core.store.state.isResizeHandleSelected) {
          selectionGroup.beginTransform();

          const clientX = event.clientX - this._core.store.offsetX;
          const clientY = event.clientY - this._core.store.offsetY;

          this._core.store.state.isResizing = true;
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = selectionGroup.width;
          this.initialSize.height = selectionGroup.height;
          this.initialSize.x = selectionGroup.translateX;
          this.initialSize.y = selectionGroup.translateY;
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
        if (selectionGroup && this._core.store.state.isResizeHandleSelected) {
          selectionGroup.beginTransform();

          const clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
          const clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

          this._core.store.state.isResizing = true;
          this.initialMouseX = clientX;
          this.initialMouseY = clientY;
          this.initialSize.width = selectionGroup.width;
          this.initialSize.height = selectionGroup.height;
          this.initialSize.x = selectionGroup.translateX;
          this.initialSize.y = selectionGroup.translateY;

          const timeout = this._core.store.state.longTouchTimeout;

          if (timeout) {
            globalThis.clearTimeout?.(timeout);
          }
        }
      }
    }
  }

  /**
   * Handles the pointer move event during an active resize operation.
   * Calculates the new dimensions based on pointer movement, taking into account:
   * - The rotation of the selection group (transforms screen delta to local space)
   * - The current canvas scale/zoom level
   * - The type of resize handle being dragged (TopLeft, TopRight, BottomLeft, BottomRight)
   * - Aspect ratio locking when Shift key is pressed (mouse only)
   *
   * Uses a movement threshold to prevent accidental micro-resizes.
   * The resize is applied symmetrically around the center point.
   *
   * @param event - The PointerEvent containing current pointer position and modifier keys
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isResizing && selectionGroup) {
        const clientX = event.clientX - this._core.store.offsetX;
        const clientY = event.clientY - this._core.store.offsetY;

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        const resizeDeltaX = Math.abs(dx);
        const resizeDeltaY = Math.abs(dy);
        const resizeThreshold = 5;

        if (resizeDeltaX > resizeThreshold || resizeDeltaY > resizeThreshold) {
          this.hasResized = true;
        }

        if (!this.hasResized) {
          return;
        }

        const rotation = selectionGroup.rotation;
        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);
        const objectScale = selectionGroup.scale || 1;
        const currentScale = this._core.store.state.scale;

        // Calculate delta in local unrotated space
        // We rotate the screen delta by -rotation to align with the object's axes
        const localDx = (dx * cos + dy * sin) / currentScale;
        const localDy = (-dx * sin + dy * cos) / currentScale;

        // Calculate the center of the selection group before resize
        const initialCenterX = this.initialSize.x + this.initialSize.width / objectScale / 2;
        const initialCenterY = this.initialSize.y + this.initialSize.height / objectScale / 2;

        // The center moves by half of the screen delta (scaled)
        // This is true regardless of rotation because the resize happens symmetrically around the center
        // relative to the fixed point logic
        const newCenterX = initialCenterX + dx / currentScale / 2;
        const newCenterY = initialCenterY + dy / currentScale / 2;

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - localDx * objectScale;
            this.newSize.height = this.initialSize.height - localDy * objectScale;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + localDx * objectScale;
            this.newSize.height = this.initialSize.height - localDy * objectScale;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - localDx * objectScale;
            this.newSize.height = this.initialSize.height + localDy * objectScale;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + localDx * objectScale;
            this.newSize.height = this.initialSize.height + localDy * objectScale;
            break;
        }

        // Lock aspect ratio when Shift key is pressed
        if (event.shiftKey) {
          this.constrainToAspectRatio();
        }

        this.newSize.x = newCenterX - this.newSize.width / objectScale / 2;
        this.newSize.y = newCenterY - this.newSize.height / objectScale / 2;

        selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);

        if (this.shouldRebaseResizeBaseline(selectionGroup)) {
          this.rebaseResizeBaseline(selectionGroup, clientX, clientY);
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      const oneFingerTouch = activePointers[0];

      if (!oneFingerTouch) {
        return;
      }

      const selectionGroup = this._core.store.selectionGroup;
      if (this._core.store.state.isResizing && selectionGroup) {
        const clientX = Math.round(oneFingerTouch.clientX - this._core.store.offsetX);
        const clientY = Math.round(oneFingerTouch.clientY - this._core.store.offsetY);

        const dx = clientX - this.initialMouseX;
        const dy = clientY - this.initialMouseY;

        const resizeDeltaX = Math.abs(dx);
        const resizeDeltaY = Math.abs(dy);
        const resizeThreshold = 5;

        if (resizeDeltaX > resizeThreshold || resizeDeltaY > resizeThreshold) {
          const timeout = this._core.store.state.longTouchTimeout;

          if (timeout) {
            globalThis.clearTimeout?.(timeout);
          }

          this.hasResized = true;
        }

        if (!this.hasResized) {
          return;
        }

        const rotation = selectionGroup.rotation;
        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);
        const objectScale = selectionGroup.scale || 1;
        const currentScale = this._core.store.state.scale;

        // Calculate delta in local unrotated space
        // We rotate the screen delta by -rotation to align with the object's axes
        const localDx = (dx * cos + dy * sin) / currentScale;
        const localDy = (-dx * sin + dy * cos) / currentScale;

        // Calculate the center of the selection group before resize
        const initialCenterX = this.initialSize.x + this.initialSize.width / objectScale / 2;
        const initialCenterY = this.initialSize.y + this.initialSize.height / objectScale / 2;

        // The center moves by half of the screen delta (scaled)
        // This is true regardless of rotation because the resize happens symmetrically around the center
        // relative to the fixed point logic
        const newCenterX = initialCenterX + dx / currentScale / 2;
        const newCenterY = initialCenterY + dy / currentScale / 2;

        switch (this._core.store.state.resizeHandleType) {
          case KritzelHandleType.TopLeft:
            this.newSize.width = this.initialSize.width - localDx * objectScale;
            this.newSize.height = this.initialSize.height - localDy * objectScale;
            break;
          case KritzelHandleType.TopRight:
            this.newSize.width = this.initialSize.width + localDx * objectScale;
            this.newSize.height = this.initialSize.height - localDy * objectScale;
            break;
          case KritzelHandleType.BottomLeft:
            this.newSize.width = this.initialSize.width - localDx * objectScale;
            this.newSize.height = this.initialSize.height + localDy * objectScale;
            break;
          case KritzelHandleType.BottomRight:
            this.newSize.width = this.initialSize.width + localDx * objectScale;
            this.newSize.height = this.initialSize.height + localDy * objectScale;
            break;
        }

        // Note: Touch events don't have shiftKey, aspect ratio locking is mouse-only

        this.newSize.x = newCenterX - this.newSize.width / objectScale / 2;
        this.newSize.y = newCenterY - this.newSize.height / objectScale / 2;

        selectionGroup.resize(this.newSize.x, this.newSize.y, this.newSize.width, this.newSize.height);

        if (this.shouldRebaseResizeBaseline(selectionGroup)) {
          this.rebaseResizeBaseline(selectionGroup, clientX, clientY);
        }
      }
    }
  }

  /**
   * Constrains the new size to maintain the original aspect ratio.
   * Uses the dominant scale factor (the axis with larger relative change)
   * to determine the final size, ensuring natural resize behavior.
   *
   * If width changed more proportionally, height is adjusted to match the aspect ratio.
   * If height changed more proportionally, width is adjusted to match the aspect ratio.
   *
   * @private
   * @remarks Does nothing if initial width or height is zero to prevent division errors
   */
  private constrainToAspectRatio(): void {
    const initialWidth = this.initialSize.width;
    const initialHeight = this.initialSize.height;

    if (initialWidth === 0 || initialHeight === 0) {
      return;
    }

    const aspectRatio = initialWidth / initialHeight;
    const widthScale = this.newSize.width / initialWidth;
    const heightScale = this.newSize.height / initialHeight;

    // Use the dominant scale factor (the one with larger magnitude change)
    if (Math.abs(widthScale - 1) > Math.abs(heightScale - 1)) {
      // Width changed more, adjust height to match
      this.newSize.height = this.newSize.width / aspectRatio;
    } else {
      // Height changed more, adjust width to match
      this.newSize.width = this.newSize.height * aspectRatio;
    }
  }

  /**
   * Handles the pointer up event to finalize a resize operation.
   * If resizing occurred (movement exceeded threshold), updates the selection group
   * and emits change events. Resets all internal state regardless of whether
   * actual resizing took place.
   *
   * For touch/pen inputs, also clears any pending long touch timeout.
   *
   * @param event - The PointerEvent containing pointer type information
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isResizing) {
        this._core.store.state.isResizing = false;

        if (this.hasResized) {
          this._core.store.selectionGroup!.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
          this._core.store.objects.stopUndoCapturing();
        }

        this.reset();
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isResizing) {
        this._core.store.state.isResizing = false;

        if (this.hasResized) {
          this._core.store.selectionGroup!.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
          this._core.store.objects.stopUndoCapturing();
        }

        this.reset();

        const timeout = this._core.store.state.longTouchTimeout;

        if (timeout) {
          globalThis.clearTimeout?.(timeout);
        }
      }
    }
  }
}
