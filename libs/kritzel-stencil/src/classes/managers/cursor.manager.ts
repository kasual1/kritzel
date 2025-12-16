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

  constructor(core: KritzelCore) {
    this._core = core;
  }

  /**
   * Sets the target element where cursor styles will be applied.
   * Also sets the pointer cursor CSS variable for child components.
   */
  setTargetElement(element: HTMLElement | null): void {
    // Reset cursor on old target
    if (this._targetElement) {
      this._targetElement.style.cursor = '';
      this._targetElement.style.removeProperty('--kritzel-pointer-cursor');
    }

    this._targetElement = element;

    // Set the pointer cursor CSS variable for child components to use
    if (this._targetElement) {
      this._targetElement.style.setProperty('--kritzel-pointer-cursor', KritzelCursorHelper.getPointerCursor());
    }
  }

  /**
   * Gets the current cursor target element.
   */
  getTargetElement(): HTMLElement | null {
    return this._targetElement;
  }

  /**
   * Sets the shadow root for element detection.
   */
  setShadowRoot(shadowRoot: ShadowRoot): void {
    this._shadowRoot = shadowRoot;
  }

  /**
   * Resets cursor to default state.
   * Should be called when all pointers are released.
   */
  resetToDefault(): void {
    this._core.store.state.cursor = { icon: 'default', iconActive: 'default' };
  }

  /**
   * Detects handle hover states using elementsFromPoint() to work with overlapped elements.
   * This approach finds all elements at the pointer position instead of relying on pointerenter/pointerleave.
   */
  updateHoverState(ev: PointerEvent): void {
    if (this._core.store.isPointerDown) return;
    if (!this._shadowRoot) return;

    const elementsAtPoint = this._shadowRoot.elementsFromPoint(ev.clientX, ev.clientY);
    if (!elementsAtPoint || elementsAtPoint.length === 0) return;

    // Check for resize handle overlays (selection group)
    const resizeHandleOverlay = elementsAtPoint.find(el => el.classList.contains('resize-handle-overlay'));
    if (resizeHandleOverlay) {
      const selectionGroup = this._core.store.selectionGroup;
      const rotationDegrees = selectionGroup?.rotationDegrees ?? 0;

      // Determine rotation offset based on handle position
      const isTopLeft = resizeHandleOverlay.classList.contains('top-left');
      const isBottomRight = resizeHandleOverlay.classList.contains('bottom-right');
      const rotationOffset = (isTopLeft || isBottomRight) ? -45 : 45;

      this._core.store.state.cursor = { icon: 'move-vertical', rotation: rotationDegrees + rotationOffset };
      return;
    }

    // Check for rotation handle overlay
    const rotationHandleOverlay = elementsAtPoint.find(el => el.classList.contains('rotation-handle-overlay'));
    if (rotationHandleOverlay) {
      this._core.store.state.cursor = { icon: 'hand', iconActive: 'hand-grab' };
      return;
    }

    // Check for line handle overlays (selection line)
    const lineHandleOverlay = elementsAtPoint.find(el => el.classList.contains('selection-line-handle-overlay'));
    if (lineHandleOverlay) {
      this._core.store.state.cursor = { icon: 'hand', iconActive: 'hand-grab' };
      return;
    }

    // Reset cursor if not hovering any handle
    this._core.store.state.cursor = { icon: 'default', iconActive: 'default' };
  }

  /**
   * Applies the current cursor state to the target element.
   * Should be called in the render loop.
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
   */
  cleanup(): void {
    if (this._targetElement) {
      this._targetElement.style.cursor = '';
      this._targetElement.style.removeProperty('--kritzel-pointer-cursor');
    }
    this._targetElement = null;
    this._shadowRoot = null;
  }
}
