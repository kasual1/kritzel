import { KritzelStore } from '../store.class';
import { KritzelBaseHandler } from './base.handler';

export class KritzelHoverHandler extends KritzelBaseHandler {

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      const hoveredObject = this._store.getObjectFromPointerEvent(event, '.object');

      if (!hoveredObject) return;

      const x = this._store.state.pointerX;
      const y = this._store.state.pointerY;

      hoveredObject.isHovered = hoveredObject.hitTest(x, y);
    }

    if (event.pointerType === 'touch') {
    }
  }
}
