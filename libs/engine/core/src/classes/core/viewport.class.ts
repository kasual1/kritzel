import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelMouseButton } from '../../enums/event-button.enum';
import { KritzelCore } from './core.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelViewportState } from '../../interfaces/viewport-state.interface';
import { debounce, DebouncedFunc } from 'lodash';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';

/**
 * Manages viewport transformations including panning, zooming, and centering.
 * Handles mouse, touch, and wheel events for viewport manipulation.
 * Supports viewport boundaries and animated transitions.
 */
export class KritzelViewport {
  /** Reference to the KritzelCore instance */
  private readonly _core: KritzelCore;
  /** Debounced function to persist viewport state to workspace */
  private readonly _debounceUpdate: DebouncedFunc<() => void>;
  /** Debounced function to end scaling state after pinch gestures */
  private readonly _debounceEndScaling: DebouncedFunc<() => void>;

  /** Debounced version of {@link syncWithVirtualKeyboard}, used while the virtual keyboard animates in/out */
  private readonly _debounceSyncWithVirtualKeyboard: DebouncedFunc<() => void>;

  /**
   * Vertical pan applied to keep the editing caret above the open virtual keyboard,
   * together with the scale it was applied at. Reverted once the keyboard closes.
   */
  private _keyboardPanOffset: { deltaY: number; scale: number } | null = null;

  /** Gap in pixels kept between the editing caret and the edge of the visible area */
  private static readonly EDITING_CARET_VISIBLE_PADDING = 24;
  /** Animation frame ID for cancellable viewport animations */
  private _animationFrameId: number | null = null;

  /** Initial distance between two touch points for pinch-to-zoom */
  initialTouchDistance: number = 0;
  /** Starting X position for pan/zoom gestures */
  startX: number = 0;
  /** Starting Y position for pan/zoom gestures */
  startY: number = 0;

  /** Minimum movement distance (in screen pixels) before broadcasting touch cursor position */
  private static readonly TOUCH_CURSOR_BROADCAST_THRESHOLD = 5;
  /** Screen X position where the current touch interaction started */
  private _touchStartScreenX: number = 0;
  /** Screen Y position where the current touch interaction started */
  private _touchStartScreenY: number = 0;
  /** Whether the touch movement threshold has been exceeded for cursor broadcasting */
  private _touchCursorBroadcastActive: boolean = false;

  /**
   * Creates a new KritzelViewport instance and initializes viewport state.
   * Sets up debounced handlers for viewport updates and scaling end events.
   * @param core - The KritzelCore instance to manage viewport for
   * @param host - The HTML element hosting the canvas
   */
  constructor(core: KritzelCore, host: HTMLElement) {
    this._core = core;
    this._core.store.state.host = host;
    this._core.store.state.viewportWidth = host.clientWidth;
    this._core.store.state.viewportHeight = host.clientHeight;
    this._core.store.state.startX = 0;
    this._core.store.state.startY = 0;
    this._core.store.state.translateX = 0;
    this._core.store.state.translateY = 0;

    this._debounceUpdate = debounce(() => {
      this._core.updateWorkspaceViewport(
        this._core.store.state.translateX,
        this._core.store.state.translateY,
        this._core.store.state.scale
      );
    }, 300);

    this._debounceEndScaling = debounce(() => {
      this._core.store.state.isScaling = false;
      this._core.rerender();
    }, 100);

    this._debounceSyncWithVirtualKeyboard = debounce(() => this.syncWithVirtualKeyboard(), 100);
  }

  /**
   * Cancels any pending debounced viewport updates.
   * Should be called before switching workspaces to prevent the old workspace's
   * viewport state from being saved to the new workspace.
   */
  cancelPendingUpdates(): void {
    this._debounceUpdate.cancel();
    this._debounceSyncWithVirtualKeyboard.cancel();
    this._keyboardPanOffset = null;
  }

  /**
   * Clamps translateX and translateY to respect viewport boundaries.
   * Boundaries are defined in world coordinates and converted to screen-space translate limits.
   * @param translateX - The proposed translateX value
   * @param translateY - The proposed translateY value
   * @returns Clamped translate values
   */
  private clampTranslate(translateX: number, translateY: number): { translateX: number; translateY: number } {
    const state = this._core.store.state;
    const { scale, viewportWidth, viewportHeight } = state;
    const { viewportBoundaryLeft, viewportBoundaryRight, viewportBoundaryTop, viewportBoundaryBottom } = state;

    // Convert world boundaries to screen-space translate limits
    // translateX = viewportX - worldX * scale, so:
    // - To show boundaryLeft at left edge (viewportX=0): translateX = -boundaryLeft * scale
    // - To show boundaryRight at right edge (viewportX=viewportWidth): translateX = viewportWidth - boundaryRight * scale
    const translateXMax = -viewportBoundaryLeft * scale;
    const translateXMin = viewportWidth - viewportBoundaryRight * scale;

    const translateYMax = -viewportBoundaryTop * scale;
    const translateYMin = viewportHeight - viewportBoundaryBottom * scale;

    // Only clamp if boundaries are finite
    let clampedX = translateX;
    let clampedY = translateY;

    if (Number.isFinite(translateXMin) && Number.isFinite(translateXMax)) {
      clampedX = Math.max(translateXMin, Math.min(translateXMax, translateX));
    } else if (Number.isFinite(translateXMin)) {
      clampedX = Math.max(translateXMin, translateX);
    } else if (Number.isFinite(translateXMax)) {
      clampedX = Math.min(translateXMax, translateX);
    }

    if (Number.isFinite(translateYMin) && Number.isFinite(translateYMax)) {
      clampedY = Math.max(translateYMin, Math.min(translateYMax, translateY));
    } else if (Number.isFinite(translateYMin)) {
      clampedY = Math.max(translateYMin, translateY);
    } else if (Number.isFinite(translateYMax)) {
      clampedY = Math.min(translateYMax, translateY);
    }

    return { translateX: clampedX, translateY: clampedY };
  }

  /**
   * Calculates the effective minimum scale considering both the configured scaleMin
   * and the minimum scale required to keep the viewport within boundaries.
   * This prevents users from zooming out far enough to see past the boundaries.
   * @returns The effective minimum scale value
   */
  private getEffectiveMinScale(): number {
    const state = this._core.store.state;
    const { viewportWidth, viewportHeight, scaleMin } = state;
    const { viewportBoundaryLeft, viewportBoundaryRight, viewportBoundaryTop, viewportBoundaryBottom } = state;

    const boundaryWidth = viewportBoundaryRight - viewportBoundaryLeft;
    const boundaryHeight = viewportBoundaryBottom - viewportBoundaryTop;

    // If boundaries are infinite, just use the configured scaleMin
    if (!Number.isFinite(boundaryWidth) || !Number.isFinite(boundaryHeight)) {
      return scaleMin;
    }

    // Calculate minimum scale to fit viewport within boundaries
    // scale >= viewportWidth / boundaryWidth and scale >= viewportHeight / boundaryHeight
    const minScaleX = boundaryWidth > 0 ? viewportWidth / boundaryWidth : scaleMin;
    const minScaleY = boundaryHeight > 0 ? viewportHeight / boundaryHeight : scaleMin;
    const minScaleForBoundaries = Math.max(minScaleX, minScaleY);

    return Math.max(scaleMin, minScaleForBoundaries);
  }

  /**
   * Handles viewport resize events.
   * Updates the stored viewport dimensions and triggers a rerender.
   */
  handleResize(): void {
    this._core.store.state.viewportWidth = this._core.store.host.clientWidth;
    this._core.store.state.viewportHeight = this._core.store.host.clientHeight;
    this._core.store.state.hasViewportChanged = true;
    this._core.rerender();
    this._debounceSyncWithVirtualKeyboard();
  }

  /**
   * Handles visual viewport resize events (e.g. the mobile virtual keyboard opening or closing).
   * Schedules a check that pans the canvas so the caret of the text or shape being edited
   * is not hidden behind the keyboard, and restores the previous position once it closes.
   */
  handleVisualViewportResize(): void {
    this._debounceSyncWithVirtualKeyboard();
  }

  /**
   * Restores the viewport position from before the virtual keyboard opened if the keyboard
   * has closed; otherwise keeps the editing caret visible above the keyboard.
   */
  syncWithVirtualKeyboard(): void {
    if (this._keyboardPanOffset && !KritzelKeyboardHelper.isKeyboardOpen()) {
      this.restoreKeyboardPanOffset();
      return;
    }

    this.keepEditingCaretVisible();
  }

  /**
   * Reverts the vertical pan applied while the virtual keyboard was open.
   * Applied as a delta so any panning the user did in the meantime is preserved.
   * Skipped if the user zoomed in the meantime, since the offset no longer applies.
   */
  private restoreKeyboardPanOffset(): void {
    const offset = this._keyboardPanOffset;
    this._keyboardPanOffset = null;

    const { translateX, translateY, scale } = this._core.store.state;
    if (!offset || offset.deltaY === 0 || scale !== offset.scale) {
      return;
    }

    this.animateViewportTo(translateX, translateY - offset.deltaY, scale);
  }

  /**
   * Pans the canvas vertically so the caret of the text or shape currently being edited
   * lies within the visible area. The visible area is the intersection of the host element
   * and the visual viewport, which excludes the space covered by a mobile virtual keyboard.
   * Does nothing if no object is being edited or the caret is already visible.
   */
  keepEditingCaretVisible(): void {
    const activeObject = this._core.store.activeText ?? this._core.store.activeShape;
    const editor = activeObject?.editor;
    if (!activeObject?.isEditing || !editor || !editor.hasFocus()) {
      return;
    }

    let caretRect: { top: number; bottom: number };
    try {
      caretRect = editor.coordsAtPos(editor.state.selection.head);
    } catch {
      return;
    }

    const hostRect = this._core.store.host.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const visibleTop = Math.max(hostRect.top, visualViewport ? visualViewport.offsetTop : 0);
    const visibleBottom = Math.min(hostRect.bottom, visualViewport ? visualViewport.offsetTop + visualViewport.height : window.innerHeight);
    const padding = KritzelViewport.EDITING_CARET_VISIBLE_PADDING;

    if (visibleBottom - visibleTop < caretRect.bottom - caretRect.top + padding * 2) {
      return;
    }

    let deltaY = 0;
    if (caretRect.bottom + padding > visibleBottom) {
      deltaY = visibleBottom - padding - caretRect.bottom;
    } else if (caretRect.top - padding < visibleTop) {
      deltaY = visibleTop + padding - caretRect.top;
    }

    if (deltaY === 0) {
      return;
    }

    const { translateX, translateY, scale } = this._core.store.state;
    const targetTranslateY = this.clampTranslate(translateX, translateY + deltaY).translateY;

    if (KritzelKeyboardHelper.isKeyboardOpen()) {
      const previousDeltaY = this._keyboardPanOffset?.scale === scale ? this._keyboardPanOffset.deltaY : 0;
      this._keyboardPanOffset = { deltaY: previousDeltaY + (targetTranslateY - translateY), scale };
    }

    this.animateViewportTo(translateX, translateY + deltaY, scale);
  }

  /**
   * Handles pointer down events for initiating viewport interactions.
   * For mouse: Right-click starts panning mode.
   * For touch/pen: Two-finger touch initiates pinch-to-zoom.
   * Cancels any ongoing viewport animation when user starts interacting.
   * @param event - The pointer down event
   */
  handlePointerDown(event: PointerEvent): void {
    // Cancel any ongoing viewport animation when user starts interacting
    this.cancelViewportAnimation();

    if (event.pointerType === 'mouse') {
      const adjustedClientX = event.clientX - this._core.store.offsetX;
      const adjustedClientY = event.clientY - this._core.store.offsetY;

      if (event.button === KritzelMouseButton.Right) {
        this._core.store.state.isPanning = true;
        this._core.store.state.startX = adjustedClientX;
        this._core.store.state.startY = adjustedClientY;
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        this._touchStartScreenX = event.clientX;
        this._touchStartScreenY = event.clientY;
        this._touchCursorBroadcastActive = false;
      }

      if (activePointers.length === 2) {
        this._core.store.objects?.clearCursorPosition();

        const currentPath = this._core.store.currentPath;
        if (currentPath) {
          this._core.store.objects.remove(obj => obj.id === currentPath.id);
        }

        // Clear selection box when scaling starts to prevent it from remaining on screen
        if (this._core.store.state.isSelecting) {
          this._core.store.state.isSelecting = false;
          this._core.store.objects.remove(obj => obj instanceof KritzelSelectionBox);
          this._core.store.setSelectionBox(null);
          // Clear selection preview state from objects - use selectedObjects for efficiency
          this._core.store.selectedObjects.forEach(object => {
            object.isSelected = false;
          });
        }

        this._core.store.state.isScaling = true;

        const firstTouchX = activePointers[0].clientX - this._core.store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._core.store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._core.store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._core.store.offsetY;

        this.initialTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        this.startX = (firstTouchX + secondTouchX) / 2;
        this.startY = (firstTouchY + secondTouchY) / 2;
        this._core.rerender();
      }
    }
  }

  /**
   * Handles pointer move events for viewport panning and zooming.
   * For mouse: Updates pointer position and handles right-click pan dragging.
   * For touch/pen: Handles two-finger pinch-to-zoom with translation.
   * @param event - The pointer move event
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const hostRect = this._core.store.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
      this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;
      this._core.store.objects?.updateCursorPosition(this._core.store.state.pointerX, this._core.store.state.pointerY);

      if (this._core.store.state.isPanning) {
        const dx = xRelativeToHost - this._core.store.state.startX;
        const dy = yRelativeToHost - this._core.store.state.startY;

        const newTranslateX = this._core.store.state.translateX + dx;
        const newTranslateY = this._core.store.state.translateY + dy;
        const clamped = this.clampTranslate(newTranslateX, newTranslateY);
        this._core.store.state.translateX = clamped.translateX;
        this._core.store.state.translateY = clamped.translateY;
        this._core.store.state.startX = xRelativeToHost;
        this._core.store.state.startY = yRelativeToHost;
        this._core.store.state.hasViewportChanged = true;
        this._core.store.state.skipContextMenu = true;

        this._core.rerender();
        this._debounceUpdate();
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const hostRect = this._core.store.host.getBoundingClientRect();
      const xRelativeToHost = event.clientX - hostRect.left;
      const yRelativeToHost = event.clientY - hostRect.top;

      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (this._core.store.state.isScaling || activePointers.length > 1) {
        this._core.store.objects?.clearCursorPosition();
      } else {
        this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
        this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;

        if (!this._touchCursorBroadcastActive) {
          const dx = event.clientX - this._touchStartScreenX;
          const dy = event.clientY - this._touchStartScreenY;
          if (Math.sqrt(dx * dx + dy * dy) >= KritzelViewport.TOUCH_CURSOR_BROADCAST_THRESHOLD) {
            this._touchCursorBroadcastActive = true;
          }
        }

        if (this._touchCursorBroadcastActive) {
          this._core.store.objects?.updateCursorPosition(this._core.store.state.pointerX, this._core.store.state.pointerY);
        }
      }

      if (activePointers.length === 2) {
        const firstTouchX = activePointers[0].clientX - this._core.store.offsetX;
        const firstTouchY = activePointers[0].clientY - this._core.store.offsetY;

        const secondTouchX = activePointers[1].clientX - this._core.store.offsetX;
        const secondTouchY = activePointers[1].clientY - this._core.store.offsetY;

        const currentTouchDistance = Math.sqrt(Math.pow(firstTouchX - secondTouchX, 2) + Math.pow(firstTouchY - secondTouchY, 2));

        const midpointX = (firstTouchX + secondTouchX) / 2;
        const midpointY = (firstTouchY + secondTouchY) / 2;

        const scaleRatio = currentTouchDistance / this.initialTouchDistance!;
        const newScale = this._core.store.state.scale * scaleRatio;
        const effectiveMinScale = this.getEffectiveMinScale();

        if (newScale > this._core.store.state.scaleMax || newScale < effectiveMinScale) {
          const newTranslateX = this._core.store.state.translateX + midpointX - this.startX;
          const newTranslateY = this._core.store.state.translateY + midpointY - this.startY;
          const clamped = this.clampTranslate(newTranslateX, newTranslateY);
          this._core.store.state.translateX = clamped.translateX;
          this._core.store.state.translateY = clamped.translateY;
        } else {
          const translateXAdjustment = (midpointX - this._core.store.state.translateX) * (scaleRatio - 1);
          const translateYAdjustment = (midpointY - this._core.store.state.translateY) * (scaleRatio - 1);

          const newTranslateX = this._core.store.state.translateX + midpointX - this.startX - translateXAdjustment;
          const newTranslateY = this._core.store.state.translateY + midpointY - this.startY - translateYAdjustment;
          this._core.store.state.scale = newScale;
          const clamped = this.clampTranslate(newTranslateX, newTranslateY);
          this._core.store.state.translateX = clamped.translateX;
          this._core.store.state.translateY = clamped.translateY;

          this.initialTouchDistance = currentTouchDistance;
        }

        this.startX = midpointX;
        this.startY = midpointY;

        this._core.store.state.hasViewportChanged = true;

        this._core.rerender();
        this._debounceUpdate();
      }
    }
  }

  /**
   * Handles pointer up events to end viewport interactions.
   * For mouse: Ends panning mode on right-click release.
   * For touch/pen: Triggers debounced end of scaling when all fingers are lifted.
   * @param event - The pointer up event
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isPanning) {
        this._core.store.state.isPanning = false;
        this._core.rerender();
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      this._touchCursorBroadcastActive = false;

      if (this._core.store.state.pointers.size === 0) {
        this._debounceEndScaling();
      }
    }
  }

  /**
   * Handles mouse wheel events for panning and zooming.
   * Ctrl+wheel triggers zoom; regular wheel triggers pan.
   * Cancels any ongoing viewport animation when user scrolls.
   * @param event - The wheel event
   */
  handleWheel(event: WheelEvent): void {
    // Cancel any ongoing viewport animation when user scrolls
    this.cancelViewportAnimation();

    if (event.ctrlKey) {
      this.handleZoom(event);
    } else {
      this.handlePan(event);
    }
  }

  /**
   * Returns the current viewport state.
   * @returns The current viewport position, scale, and dimensions.
   */
  getViewport(): KritzelViewportState {
    const state = this._core.store.state;
    return {
      translateX: state.translateX,
      translateY: state.translateY,
      scale: state.scale,
      width: state.viewportWidth,
      height: state.viewportHeight,
    };
  }

  /**
   * Converts screen-relative pixel coordinates to world coordinates.
   * @param x - X position in screen pixels (relative to the host element)
   * @param y - Y position in screen pixels (relative to the host element)
   * @returns World coordinates { x, y }
   */
  screenToWorld(x: number, y: number): { x: number; y: number } {
    const state = this._core.store.state;
    return {
      x: (x - state.translateX) / state.scale,
      y: (y - state.translateY) / state.scale,
    };
  }

  /**
   * Converts world coordinates to screen-relative pixel coordinates.
   * @param x - X position in world coordinates
   * @param y - Y position in world coordinates
   * @returns Screen coordinates { x, y } relative to the host element
   */
  worldToScreen(x: number, y: number): { x: number; y: number } {
    const state = this._core.store.state;
    return {
      x: x * state.scale + state.translateX,
      y: y * state.scale + state.translateY,
    };
  }

  /**
   * Animates the viewport to center on the given world coordinates at the specified scale.
   * Respects scale limits and viewport boundaries.
   * @param x - X position in world coordinates to center on
   * @param y - Y position in world coordinates to center on
   * @param scale - Target scale level
   */
  setViewport(x: number, y: number, scale: number): void {
    const state = this._core.store.state;
    const clampedScale = Math.min(state.scaleMax, Math.max(this.getEffectiveMinScale(), scale));
    const targetTranslateX = state.viewportWidth / 2 - x * clampedScale;
    const targetTranslateY = state.viewportHeight / 2 - y * clampedScale;
    this.animateViewportTo(targetTranslateX, targetTranslateY, clampedScale);
  }

  /**
   * Animates the viewport to center on the given world coordinates without changing the scale.
   * @param x - X position in world coordinates to center on
   * @param y - Y position in world coordinates to center on
   */
  panTo(x: number, y: number): void {
    this.setViewport(x, y, this._core.store.state.scale);
  }

  /**
   * Animates the viewport to the given scale level.
   * Optionally centers on a world point; if omitted, zooms around the viewport center.
   * @param scale - Target scale level
   * @param worldX - Optional X position in world coordinates to center on
   * @param worldY - Optional Y position in world coordinates to center on
   */
  zoomTo(scale: number, worldX?: number, worldY?: number): void {
    const state = this._core.store.state;
    if (worldX !== undefined && worldY !== undefined) {
      this.setViewport(worldX, worldY, scale);
    } else {
      // Zoom around viewport center
      const centerWorldX = (state.viewportWidth / 2 - state.translateX) / state.scale;
      const centerWorldY = (state.viewportHeight / 2 - state.translateY) / state.scale;
      this.setViewport(centerWorldX, centerWorldY, scale);
    }
  }

  /**
   * Zooms in by a fixed step, centered on the current viewport center,
   * with a smooth animation. The resulting scale is clamped to the allowed range.
   * @param factor - Multiplicative zoom-in step
   * @param duration - Animation duration in milliseconds
   */
  zoomIn(factor: number, duration: number): void {
    this.animateZoomAroundViewportCenter(factor, duration);
  }

  /**
   * Zooms out by a fixed step, centered on the current viewport center,
   * with a smooth animation. The resulting scale is clamped to the allowed range.
   * @param factor - Multiplicative zoom-out step
   * @param duration - Animation duration in milliseconds
   */
  zoomOut(factor: number, duration: number): void {
    this.animateZoomAroundViewportCenter(1 / factor, duration);
  }

  /**
   * Smoothly zooms around the viewport center, keeping the center world point
   * fixed for the entire animation. The translation is recomputed from the fixed
   * center point on every frame (rather than interpolated independently), which
   * guarantees the center never drifts and the viewport does not jump.
   * The resulting scale is clamped to the allowed range and the translation is
   * clamped to the viewport boundaries.
   * @param scaleFactor - Multiplicative scale factor (>1 zooms in, <1 zooms out)
   * @param duration - Animation duration in milliseconds
   */
  private animateZoomAroundViewportCenter(scaleFactor: number, duration: number): void {
    this.cancelViewportAnimation();

    const state = this._core.store.state;
    const startScale = state.scale;
    const effectiveMinScale = this.getEffectiveMinScale();
    const targetScale = Math.min(state.scaleMax, Math.max(effectiveMinScale, startScale * scaleFactor));

    // The world point currently under the viewport center stays fixed.
    const centerScreenX = state.viewportWidth / 2;
    const centerScreenY = state.viewportHeight / 2;
    const centerWorldX = (centerScreenX - state.translateX) / startScale;
    const centerWorldY = (centerScreenY - state.translateY) / startScale;

    if (targetScale === startScale || duration <= 0) {
      this.applyZoomAroundCenter(targetScale, centerScreenX, centerScreenY, centerWorldX, centerWorldY);
      state.isScaling = true;
      this._core.rerender();
      this._debounceUpdate();
      this._debounceEndScaling();
      return;
    }

    const startTime = performance.now();
    state.isScaling = true;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeInOutCubic for a smooth ramp in and out
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const frameScale = startScale + (targetScale - startScale) * eased;
      this.applyZoomAroundCenter(frameScale, centerScreenX, centerScreenY, centerWorldX, centerWorldY);
      this._core.rerender();

      if (progress < 1) {
        this._animationFrameId = requestAnimationFrame(animate);
      } else {
        this._animationFrameId = null;
        state.isScaling = false;
        this._core.rerender();
        this._debounceUpdate();
      }
    };

    this._animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Applies a single zoom step that keeps the given world point anchored to the
   * given screen point at the specified scale, clamped to the viewport boundaries.
   */
  private applyZoomAroundCenter(scale: number, screenX: number, screenY: number, worldX: number, worldY: number): void {
    const state = this._core.store.state;
    state.scale = scale;
    const clamped = this.clampTranslate(screenX - worldX * scale, screenY - worldY * scale);
    state.translateX = clamped.translateX;
    state.translateY = clamped.translateY;
    state.hasViewportChanged = true;
  }

  /**
   * Centers a given object in the viewport without changing the scale.
   * The object's center point will be positioned at the viewport center.
   * Respects viewport boundary constraints.
   * @param object - The object to center in the viewport
   */
  centerInViewport(object: KritzelBaseObject): void {
    const { scale, viewportWidth, viewportHeight } = this._core.store.state;
    const { x, y, width, height } = object.rotatedBoundingBox;

    const objectCenterX = x + width / 2;
    const objectCenterY = y + height / 2;

    const newTranslateX = viewportWidth / 2 - objectCenterX * scale;
    const newTranslateY = viewportHeight / 2 - objectCenterY * scale;
    const clamped = this.clampTranslate(newTranslateX, newTranslateY);
    this._core.store.state.translateX = clamped.translateX;
    this._core.store.state.translateY = clamped.translateY;
    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
  }

  /**
   * Centers and scales the viewport to fit a given object with 10% padding.
   * Calculates the optimal scale to show the entire object while respecting
   * scale limits and viewport boundaries.
   * @param object - The object to fit in the viewport
   */
  centerFitInViewport(object: KritzelBaseObject): void {
    const scaleX = this._core.store.state.viewportWidth / (object.rotatedBoundingBox.width * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (object.rotatedBoundingBox.height * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this.getEffectiveMinScale());

    this._core.store.state.scale = clampedScale;
    this.centerInViewport(object);
  }

  /**
   * Centers the viewport on a given object and zooms out only if the object
   * does not fit at the current scale. Never zooms in — if the object already
   * fits, the scale is left unchanged.
   * @param object - The object to fit in the viewport
   */
  centerFitInViewportIfNeeded(object: KritzelBaseObject): void {
    const scaleX = this._core.store.state.viewportWidth / (object.rotatedBoundingBox.width * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (object.rotatedBoundingBox.height * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this.getEffectiveMinScale());

    if (clampedScale < this._core.store.state.scale) {
      this._core.store.state.scale = clampedScale;
    }
    this.centerInViewport(object);
  }

  /**
   * Zooms out and centers the viewport on a given object only if the object
   * does not fit at the current scale. If the object already fits, the
   * viewport is left completely unchanged.
   * @param object - The object to check and fit in the viewport
   */
  fitInViewportIfNeeded(object: KritzelBaseObject): void {
    const scaleX = this._core.store.state.viewportWidth / (object.rotatedBoundingBox.width * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (object.rotatedBoundingBox.height * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this.getEffectiveMinScale());

    if (clampedScale < this._core.store.state.scale) {
      this._core.store.state.scale = clampedScale;
      this.centerInViewport(object);
    }
  }

  /**
   * Smoothly brings a given object into view if it is not fully visible within
   * the current viewport. Zooms out only if the object is too large to fit at
   * the current scale; never zooms in. If the object is already fully visible,
   * the viewport is left unchanged.
   * @param object - The object to bring into view
   */
  bringIntoViewIfNeeded(object: KritzelBaseObject): void {
    const { scale, translateX, translateY, viewportWidth, viewportHeight } = this._core.store.state;
    const bounds = object.rotatedBoundingBox;

    // Compute the object's bounding box in screen-space coordinates
    const screenLeft = bounds.x * scale + translateX;
    const screenTop = bounds.y * scale + translateY;
    const screenRight = (bounds.x + bounds.width) * scale + translateX;
    const screenBottom = (bounds.y + bounds.height) * scale + translateY;

    // If fully visible, no adjustment needed
    if (screenLeft >= 0 && screenTop >= 0 && screenRight <= viewportWidth && screenBottom <= viewportHeight) {
      return;
    }

    // Calculate the scale needed to fit the object with padding; never zoom in
    const scaleX = viewportWidth / (bounds.width * 1.1);
    const scaleY = viewportHeight / (bounds.height * 1.1);
    const fitScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedFitScale = Math.max(fitScale, this.getEffectiveMinScale());
    const targetScale = Math.min(clampedFitScale, scale);

    // Animate to center the object at the target scale
    const objectCenterX = bounds.x + bounds.width / 2;
    const objectCenterY = bounds.y + bounds.height / 2;
    const targetTranslateX = viewportWidth / 2 - objectCenterX * targetScale;
    const targetTranslateY = viewportHeight / 2 - objectCenterY * targetScale;
    const clamped = this.clampTranslate(targetTranslateX, targetTranslateY);

    this.animateViewportTo(clamped.translateX, clamped.translateY, targetScale);
  }

  /**
   * Handles zoom operations triggered by wheel events with Ctrl key.
   * Zooms around the cursor position, respecting scale limits.
   * Also handles horizontal pan from trackpad pinch+drag gestures.
   * @param event - The wheel event with Ctrl modifier
   */
  private handleZoom(event: WheelEvent): void {
    this._core.store.state.isScaling = true;
    const rect = this._core.store.host.getBoundingClientRect();
    const xRelativeToHost = event.clientX - rect.left;
    const yRelativeToHost = event.clientY - rect.top;

    this._core.store.state.pointerX = (xRelativeToHost - this._core.store.state.translateX) / this._core.store.state.scale;
    this._core.store.state.pointerY = (yRelativeToHost - this._core.store.state.translateY) / this._core.store.state.scale;
    this._core.store.objects?.updateCursorPosition(this._core.store.state.pointerX, this._core.store.state.pointerY);

    const rawScaleFactor = 1 + (event.deltaY * -0.012);
    const scaleFactor = Math.max(0.8, Math.min(1.2, rawScaleFactor));
    const effectiveMinScale = this.getEffectiveMinScale();
    const newScale = Math.min(this._core.store.state.scaleMax, Math.max(effectiveMinScale, this._core.store.state.scale * scaleFactor));

    const scaleRatio = newScale / this._core.store.state.scale;
    const translateXAdjustment = (xRelativeToHost - this._core.store.state.translateX) * (scaleRatio - 1);
    const translateYAdjustment = (yRelativeToHost - this._core.store.state.translateY) * (scaleRatio - 1);

    this._core.store.state.scale = newScale;

    let newTranslateX = this._core.store.state.translateX - translateXAdjustment;
    let newTranslateY = this._core.store.state.translateY - translateYAdjustment;

    // Apply horizontal pan from trackpad pinch+drag gestures
    if (event.deltaX !== 0) {
      newTranslateX -= event.deltaX * 0.8;
    }

    const clamped = this.clampTranslate(newTranslateX, newTranslateY);
    this._core.store.state.translateX = clamped.translateX;
    this._core.store.state.translateY = clamped.translateY;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
    this._debounceEndScaling();
  }

  /**
   * Handles pan operations triggered by wheel events (without Ctrl).
   * Applies a pan speed multiplier and clamps to viewport boundaries.
   * @param event - The wheel event without Ctrl modifier
   */
  private handlePan(event: WheelEvent): void {
    const panSpeed = 0.8;

    const newTranslateX = this._core.store.state.translateX - event.deltaX * panSpeed;
    const newTranslateY = this._core.store.state.translateY - event.deltaY * panSpeed;
    const clamped = this.clampTranslate(newTranslateX, newTranslateY);
    this._core.store.state.translateX = clamped.translateX;
    this._core.store.state.translateY = clamped.translateY;

    this._core.store.state.hasViewportChanged = true;

    this._core.rerender();
    this._debounceUpdate();
  }

  /**
   * Cancels any ongoing viewport animation.
   * Called when user interacts with the canvas during animation.
   */
  cancelViewportAnimation(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Animates the viewport to the specified position and scale.
   * @param targetTranslateX - Target X translation
   * @param targetTranslateY - Target Y translation
   * @param targetScale - Target scale
   * @param duration - Animation duration in milliseconds (default 150)
   */
  animateViewportTo(targetTranslateX: number, targetTranslateY: number, targetScale: number, duration = 150): void {
    // Cancel any existing animation
    this.cancelViewportAnimation();

    if (duration <= 0) {
      // Apply immediately; interpolating with duration 0 divides by zero
      // (rAF timestamps can precede performance.now()), producing NaN state.
      this._core.store.state.scale = targetScale;
      const clamped = this.clampTranslate(targetTranslateX, targetTranslateY);
      this._core.store.state.translateX = clamped.translateX;
      this._core.store.state.translateY = clamped.translateY;
      this._core.store.state.hasViewportChanged = true;
      this._core.rerender();
      this._debounceUpdate();
      return;
    }

    const startTranslateX = this._core.store.state.translateX;
    const startTranslateY = this._core.store.state.translateY;
    const startScale = this._core.store.state.scale;
    const startTime = performance.now();

    this._core.store.state.isScaling = true;

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      // Clamp to [0, 1]; rAF timestamps can precede startTime, yielding negative progress
      const progress = Math.min(Math.max(elapsed, 0) / duration, 1);
      // easeOutCubic easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      this._core.store.state.scale = startScale + (targetScale - startScale) * eased;
      const newTranslateX = startTranslateX + (targetTranslateX - startTranslateX) * eased;
      const newTranslateY = startTranslateY + (targetTranslateY - startTranslateY) * eased;
      const clamped = this.clampTranslate(newTranslateX, newTranslateY);
      this._core.store.state.translateX = clamped.translateX;
      this._core.store.state.translateY = clamped.translateY;
      this._core.store.state.hasViewportChanged = true;
      this._core.rerender();

      if (progress < 1) {
        this._animationFrameId = requestAnimationFrame(animate);
      } else {
        this._animationFrameId = null;
        this._core.store.state.isScaling = false;
        this._core.rerender();
        this._debounceUpdate();
      }
    };

    this._animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Centers and fits the nearest content objects in the viewport.
   * Finds up to maxObjects closest objects to the current viewport center
   * and animates the viewport to show them.
   * @param maxObjects - Maximum number of objects to consider (default 20)
   * @returns true if content was found and viewport is animating, false if no content exists
   */
  centerFitNearestContent(maxObjects = 20): boolean {
    const allObjects = this._core.store.allNonSelectionObjects;

    if (allObjects.length === 0) {
      return false;
    }

    // Calculate current viewport center in canvas coordinates
    const viewportCenterX = -this._core.store.state.translateX / this._core.store.state.scale + this._core.store.state.viewportWidth / 2 / this._core.store.state.scale;
    const viewportCenterY = -this._core.store.state.translateY / this._core.store.state.scale + this._core.store.state.viewportHeight / 2 / this._core.store.state.scale;

    // Sort objects by distance from viewport center (using object center)
    const objectsWithDistance = allObjects.map(obj => {
      const bounds = obj.rotatedBoundingBox;
      const objectCenterX = bounds.x + bounds.width / 2;
      const objectCenterY = bounds.y + bounds.height / 2;
      const distance = Math.sqrt(
        Math.pow(objectCenterX - viewportCenterX, 2) + Math.pow(objectCenterY - viewportCenterY, 2)
      );
      return { obj, distance };
    });

    objectsWithDistance.sort((a, b) => a.distance - b.distance);

    // Take up to maxObjects closest objects
    const nearestObjects = objectsWithDistance.slice(0, maxObjects).map(item => item.obj);

    // Calculate combined bounds of nearest objects
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of nearestObjects) {
      const bounds = obj.rotatedBoundingBox;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Calculate scale to fit with 10% padding
    const scaleX = this._core.store.state.viewportWidth / (contentWidth * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (contentHeight * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this.getEffectiveMinScale());

    // Calculate target translation to center content
    const targetTranslateX = this._core.store.state.viewportWidth / 2 - contentCenterX * clampedScale;
    const targetTranslateY = this._core.store.state.viewportHeight / 2 - contentCenterY * clampedScale;

    // Animate to the target position
    this.animateViewportTo(targetTranslateX, targetTranslateY, clampedScale);

    return true;
  }

  /**
   * Centers and fits the provided objects in the viewport.
   * Calculates the combined bounding box of the provided objects and optionally animates the viewport to show them.
   * @param objects - Objects to include in the fit operation.
   * @param animate - Whether to animate the viewport transition (default: true)
   * @returns true if at least one object was provided and viewport was adjusted, false otherwise
   */
  centerFitObjects<T extends Element>(objects: KritzelBaseObject<T>[], animate = true): boolean {
    if (objects.length === 0) {
      return false;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of objects) {
      const bounds = obj.rotatedBoundingBox;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const contentCenterX = minX + contentWidth / 2;
    const contentCenterY = minY + contentHeight / 2;

    // Calculate scale to fit with 10% padding
    const scaleX = this._core.store.state.viewportWidth / (contentWidth * 1.1);
    const scaleY = this._core.store.state.viewportHeight / (contentHeight * 1.1);
    const newScale = Math.min(scaleX, scaleY, this._core.store.state.scaleMax);
    const clampedScale = Math.max(newScale, this.getEffectiveMinScale());

    // Calculate target translation to center content
    const targetTranslateX = this._core.store.state.viewportWidth / 2 - contentCenterX * clampedScale;
    const targetTranslateY = this._core.store.state.viewportHeight / 2 - contentCenterY * clampedScale;

    // Animate or set immediately based on the animate parameter
    this.animateViewportTo(targetTranslateX, targetTranslateY, clampedScale, animate ? 150 : 0);

    return true;
  }

  /**
   * Centers and fits ALL objects in the viewport, including objects not currently rendered.
   * Calculates the combined bounding box of all objects and optionally animates the viewport to show them.
   * @param animate - Whether to animate the viewport transition (default: true)
   * @returns true if objects were found and viewport was adjusted, false if no objects exist
   */
  centerFitAllObjects(animate = true): boolean {
    return this.centerFitObjects(this._core.store.allNonSelectionObjects, animate);
  }
}
