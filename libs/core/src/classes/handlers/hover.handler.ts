import { UpmadeCore } from '../core/core.class';
import { UpmadeBaseHandler } from './base.handler';

/**
 * Handles hover interactions on the Upmade canvas.
 * Detects when the pointer moves over canvas objects and updates their hover state accordingly.
 * Currently only processes mouse input, with placeholder support for touch and pen devices.
 */
export class UpmadeHoverHandler extends UpmadeBaseHandler {

  /**
   * Creates a new instance of the hover handler.
   * @param core - The UpmadeCore instance that provides access to canvas state and object detection.
   */
  constructor(core: UpmadeCore) {
    super(core);
  }

  /**
   * Handles pointer move events to detect and update object hover states.
   * For mouse input, performs a hit test on the object under the pointer and updates
   * its `isHovered` property based on whether the pointer coordinates intersect with the object.
   * Touch and pen input types are recognized but not yet implemented.
   * @param event - The pointer event containing information about the pointer type and position.
   * @returns void - This method does not return a value; it updates object state as a side effect.
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      const hoveredObject = this._core.getObjectFromPointerEvent(event, '.object');

      if (!hoveredObject) return;

      const x = this._core.store.state.pointerX;
      const y = this._core.store.state.pointerY;

      hoveredObject.isHovered = hoveredObject.hitTest(x, y);
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    }
  }
}
