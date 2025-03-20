import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelStore } from "../../stores/store";
import { KritzelSelectionGroup } from "../objects/selection-group.class";
import { KritzelBaseHandler } from "./base-handler";

enum SelectionHandleType {
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
}

export class KritzelResizeHandler extends KritzelBaseHandler {
  initialMouseX: number = 0;
  initialMouseY: number = 0;
  initialWidth: number = 0;
  initialHeight: number = 0;
  initialTranslateX: number = 0;
  initialTranslateY: number = 0;
  handleType: SelectionHandleType | null = null;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const selectionHandle = path.find(element => element.classList && element.classList.contains('selection-handle'));

      const isHandleSelected = selectionHandle ? true : false;

      const selectedObject = this._store.findObjectById(objectElement?.id);

      if (selectedObject && isHandleSelected) {
        this._store.state.selectionGroup = selectedObject as KritzelSelectionGroup;
        this._store.state.isResizing = true;
        this.initialMouseX = event.clientX;
        this.initialMouseY = event.clientY;
        this.initialWidth = selectedObject.width;
        this.initialHeight = selectedObject.height;
        this.handleType = selectionHandle?.classList[1] as SelectionHandleType;
        this.initialTranslateX = selectedObject.translateX;
        this.initialTranslateY = selectedObject.translateY;
      }
		}
  }

  handleMouseMove(event: MouseEvent): void {
    if(this._store.state.isResizing && this._store.state.selectionGroup) {

      const dx = event.clientX - this.initialMouseX;
      const dy = event.clientY - this.initialMouseY;

      let width, height, x, y;

      switch (this.handleType) {
        case SelectionHandleType.TopLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight - dy;
          x = dx + this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.TopRight:
          width = this.initialWidth + dx;
          height = this.initialHeight - dy;
          x = this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.BottomLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight + dy;
          x = dx + this.initialTranslateX;
          y = this.initialTranslateY;
          this._store.state.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.BottomRight:
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
      this._store.state.selectionGroup = null;
      this.handleType = null;

      this._store.rerender();

    }
  }
}
