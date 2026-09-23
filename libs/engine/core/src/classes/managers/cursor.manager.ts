import { KritzelCursorHelper } from '../../helpers/cursor.helper';
import { KritzelCore } from '../core/core.class';

/**
 * Manages cursor state and updates across the application.
 * Handles cursor changes based on handle hovers, tool states, and interactions.
 */
export class KritzelCursorManager {
  private readonly _core: KritzelCore;
  private _targetElement: HTMLElement | null = null;
  private _shadowRoot: ShadowRoot | null = null;

  /**
   * Creates a new KritzelCursorManager instance.
   * @param core - The KritzelCore instance that provides access to the store and other core functionality.
   */
  constructor(core: KritzelCore) {
    this._core = core;
  }

  /**
   * Sets the target element where cursor styles will be applied.
   * Resets any cursor styles on the previous target element before setting the new one.
   * Also sets the `--kritzel-global-pointer-cursor` CSS variable for child components to use.
   * @param element - The HTML element to apply cursor styles to, or null to clear the target.
   */
  setTargetElement(element: HTMLElement | null): void {
    // Reset cursor on old target
    if (this._targetElement) {
      this._targetElement.style.cursor = '';
      this._targetElement.style.removeProperty('--kritzel-global-default-cursor');
      this._targetElement.style.removeProperty('--kritzel-global-pointer-cursor');
    }

    this._targetElement = element;

    // Set the pointer cursor CSS variable for child components to use
    if (this._targetElement) {
      this._targetElement.style.setProperty('--kritzel-global-default-cursor', KritzelCursorHelper.getCursor({ iconName: 'default' }));
      this._targetElement.style.setProperty('--kritzel-global-pointer-cursor', KritzelCursorHelper.getPointerCursor());
    }
  }

  /**
   * Gets the current cursor target element.
   * @returns The HTML element where cursor styles are applied, or null if not set.
   */
  getTargetElement(): HTMLElement | null {
    return this._targetElement;
  }

  /**
   * Sets the shadow root used for element detection in hover state calculations.
   * Required for `elementsFromPoint()` to work within the shadow DOM.
   * @param shadowRoot - The ShadowRoot instance of the component.
   */
  setShadowRoot(shadowRoot: ShadowRoot): void {
    this._shadowRoot = shadowRoot;
  }

  /**
   * Resets cursor to default state by setting both icon and iconActive to 'default'.
   * Should be called when all pointers are released to return to the standard cursor.
   */
  resetToDefault(): void {
    this._core.store.state.cursor = { icon: 'default', iconActive: 'default' };
  }

  /**
   * Detects handle hover states using elementsFromPoint() to work with overlapped elements.
   * This approach finds all elements at the pointer position instead of relying on pointerenter/pointerleave,
   * which allows proper detection even when elements overlap.
   *
   * Updates the cursor state based on which handle type is being hovered:
   * - Resize handle overlays: Sets a rotated vertical move cursor based on handle position and selection rotation.
   * - Rotation handle overlays: Sets a hand cursor that changes to grab when active.
   * - Line handle overlays: Sets a hand cursor that changes to grab when active.
   * - No handle: Resets to default cursor.
   *
   * @param ev - The PointerEvent containing the cursor position (clientX, clientY).
   */
  updateHoverState(ev: PointerEvent): void {
    if (this._core.store.isPointerDown) return;
    if (!this._shadowRoot) return;

    const elementsAtPoint = this._shadowRoot.elementsFromPoint(ev.clientX, ev.clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) {
      this.resetToDefault();
      return;
    }

    // Check for resize handle overlays (selection group)
    const resizeHandleOverlay = elementsAtPoint.find(el => el.classList.contains('resize-handle-overlay'));
    if (resizeHandleOverlay) {
      const selectionGroup = this._core.store.selectionGroup;
      const rotationDegrees = selectionGroup?.rotationDegrees ?? 0;

      // Determine rotation offset based on handle position
      const isTopLeft = resizeHandleOverlay.classList.contains('top-left');
      const isBottomRight = resizeHandleOverlay.classList.contains('bottom-right');
      const rotationOffset = (isTopLeft || isBottomRight) ? -45 : 45;

      this._core.store.state.cursor = { icon: 'moveVertical', rotation: rotationDegrees + rotationOffset };
      return;
    }

    // Check for rotation handle overlay
    const rotationHandleOverlay = elementsAtPoint.find(el => el.classList.contains('rotation-handle-overlay'));
    if (rotationHandleOverlay) {
      this._core.store.state.cursor = { icon: 'hand', iconActive: 'handGrab' };
      return;
    }

    // Check for line handle overlays (selection line)
    const lineHandleOverlay = elementsAtPoint.find(el => el.classList.contains('selection-line-handle-overlay'));
    if (lineHandleOverlay) {
      this._core.store.state.cursor = { icon: 'hand', iconActive: 'handGrab' };
      return;
    }

    // Reset cursor if not hovering any handle
    this._core.store.state.cursor = { icon: 'default', iconActive: 'default' };
  }

  /**
   * Applies the current cursor state to the target element.
   * Reads the cursor configuration from the store state and uses KritzelCursorHelper
   * to generate the appropriate cursor value. Uses the active icon when pointer is down,
   * otherwise uses the default icon.
   * Should be called in the render loop to keep the cursor in sync with state.
   */
  applyCursor(): void {
    const state = this._core.store.state;
    const isPointerDown = this._core.store.isPointerDown;

    const icon = state.cursor?.icon;
    const iconActive = state.cursor?.iconActive ?? icon;
    const rotation = state.cursor?.rotation;

    const cursor = KritzelCursorHelper.getCursor({
      iconName: isPointerDown ? iconActive : icon,
      rotation: rotation,
    });

    if (this._targetElement) {
      this._targetElement.style.cursor = cursor;
    }
  }

  /**
   * Cleans up cursor state when the component is disconnected.
   * Removes cursor styles and CSS custom properties from the target element,
   * then clears all internal references to allow garbage collection.
   */
  cleanup(): void {
    if (this._targetElement) {
      this._targetElement.style.cursor = '';
      this._targetElement.style.removeProperty('--kritzel-global-default-cursor');
      this._targetElement.style.removeProperty('--kritzel-global-pointer-cursor');
    }
    this._targetElement = null;
    this._shadowRoot = null;
  }
}
