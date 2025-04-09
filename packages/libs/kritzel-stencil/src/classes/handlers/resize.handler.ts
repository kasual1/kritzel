import { KritzelHandleType } from "../../enums/handle-type.enum";
import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelStore } from "../store.class";
import { KritzelBaseHandler } from "./base.handler";

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;
  initialWidth: number = 0;
  initialHeight: number = 0;
  initialTranslateX: number = 0;
  initialTranslateY: number = 0;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {

      if (this._store.state.selectionGroup && this._store.state.isResizeHandleSelected) {
        this._store.state.isResizing = true;
        this.initialMouseX = event.clientX;
        this.initialMouseY = event.clientY;
        this.initialWidth = this._store.state.selectionGroup.width;
        this.initialHeight = this._store.state.selectionGroup.height;
        this.initialTranslateX = this._store.state.selectionGroup.translateX;
        this.initialTranslateY = this._store.state.selectionGroup.translateY;
      }
		}
  }

  handleMouseMove(event: MouseEvent): void {
    if(this._store.state.isResizing && this._store.state.selectionGroup) {

      const dx = (event.clientX - this.initialMouseX) / this._store.state.scale;
      const dy = (event.clientY - this.initialMouseY) / this._store.state.scale;

      let width, height, x, y;

      switch (this._store.state.resizeHandleType) {
        case KritzelHandleType.TopLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight - dy;
          x = dx + this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case KritzelHandleType.TopRight:
          width = this.initialWidth + dx;
          height = this.initialHeight - dy;
          x = this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case KritzelHandleType.BottomLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight + dy;
          x = dx + this.initialTranslateX;
          y = this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case KritzelHandleType.BottomRight:
          width = this.initialWidth + dx;
          height = this.initialHeight + dy;
          x = this.initialTranslateX;
          y = this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
      }

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isResizing) {
      this._store.state.isResizing = false;
      this.initialMouseX = 0;
      this.initialMouseY = 0;
      this.initialWidth = 0;
      this.initialHeight = 0;
      this.initialTranslateX = 0;
      this.initialTranslateY = 0;
      this._store.rerender();
    }
  }
}
