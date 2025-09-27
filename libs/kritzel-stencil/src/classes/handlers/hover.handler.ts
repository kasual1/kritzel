import { KritzelCore } from '../core/core.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelHoverHandler extends KritzelBaseHandler {

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      const hoveredObject = this._core.getObjectFromPointerEvent(event, '.object');

      if (!hoveredObject) return;

      const x = this._core.store.state.pointerX;
      const y = this._core.store.state.pointerY;

      hoveredObject.isHovered = hoveredObject.hitTest(x, y);
    }

    if (event.pointerType === 'touch') {
    }
  }
}
