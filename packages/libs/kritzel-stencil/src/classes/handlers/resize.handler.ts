import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelObject } from "../../interfaces/object.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";
import { kritzelViewportState } from "../../stores/viewport.store";

enum SelectionHandleType {
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
}
export class KritzelResizeHandler {
  isResizing: boolean = false;
  initialMouseX: number = 0;
  initialMouseY: number = 0;
  initialWidth: number = 0;
  initialHeight: number = 0;
  initialTranslateX: number = 0;
  initialTranslateY: number = 0;
  selectedObject: KritzelObject | null = null;
  handleType: SelectionHandleType | null = null;

  constructor() {}

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const selectionHandle = path.find(element => element.classList && element.classList.contains('selection-handle'));

      const isHandleSelected = selectionHandle ? true : false;

      const selectedObject = findObjectById(objectElement?.id);

      if (selectedObject && isHandleSelected) {
        this.isResizing = true;
        this.initialMouseX = event.clientX;
        this.initialMouseY = event.clientY;
        this.initialWidth = selectedObject.width;
        this.initialHeight = selectedObject.height;
        this.selectedObject = selectedObject;
        this.handleType = selectionHandle?.classList[1] as SelectionHandleType;
        this.initialTranslateX = selectedObject.translateX;
        this.initialTranslateY = selectedObject.translateY;
      }
		}
  }

  handleMouseMove(event: MouseEvent): void {
    if(this.isResizing && this.selectedObject) {

      const dx = (event.clientX - this.initialMouseX) / kritzelViewportState.scale;
      const dy = (event.clientY - this.initialMouseY) / kritzelViewportState.scale;

      let width, height, x, y;

      switch (this.handleType) {
        case SelectionHandleType.TopLeft:
          width = this.initialWidth - dx / this.selectedObject.scale;
          height = this.initialHeight - dy / this.selectedObject.scale;
          x = dx + this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this.selectedObject.updateDimensions(x, y, width, height);
          break;
        case SelectionHandleType.TopRight:
          width = this.initialWidth + dx / this.selectedObject.scale;
          height = this.initialHeight - dy / this.selectedObject.scale;
          x = this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this.selectedObject.updateDimensions(x, y, width, height);
          break;
        case SelectionHandleType.BottomLeft:
          width = this.initialWidth - dx / this.selectedObject.scale;
          height = this.initialHeight + dy / this.selectedObject.scale;
          x = dx + this.initialTranslateX;
          y = this.initialTranslateY;
          this.selectedObject.updateDimensions(x, y, width, height);
          break;
        case SelectionHandleType.BottomRight:
          width = this.initialWidth + dx / this.selectedObject.scale;
          height = this.initialHeight + dy / this.selectedObject.scale;
          x = this.initialTranslateX;
          y = this.initialTranslateY;
          this.selectedObject.updateDimensions(x, y, width, height);
          break;
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.isResizing) {
      this.isResizing = false;
      this.selectedObject = null;
      this.handleType = null;

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }
}
