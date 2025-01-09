import { KritzelClickHelper } from "../../helpers/click.helper";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState, findObjectById } from "../../stores/engine.store";
import { KrtizelSelectionGroup } from "../objects/selection-group.class";

enum SelectionHandleType {
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
}

export class KritzelResizeHandler {
  selectionState: KritzelSelectionState;

  initialMouseX: number = 0;
  initialMouseY: number = 0;
  initialWidth: number = 0;
  initialHeight: number = 0;
  initialTranslateX: number = 0;
  initialTranslateY: number = 0;
  handleType: SelectionHandleType | null = null;

  constructor(selectionState: KritzelSelectionState) {
    this.selectionState = selectionState;
  }

  handleMouseDown(event: MouseEvent): void {
    if (KritzelClickHelper.isLeftClick(event)) {
			const path = event.composedPath() as HTMLElement[];
			const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const selectionHandle = path.find(element => element.classList && element.classList.contains('selection-handle'));

      const isHandleSelected = selectionHandle ? true : false;

      const selectedObject = findObjectById(objectElement?.id);

      if (selectedObject && isHandleSelected) {
        this.selectionState.selectionGroup = selectedObject as KrtizelSelectionGroup;
        this.selectionState.isResizing = true;
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
    if(this.selectionState.isResizing && this.selectionState.selectionGroup) {

      const dx = event.clientX - this.initialMouseX;
      const dy = event.clientY - this.initialMouseY;

      let width, height, x, y;

      switch (this.handleType) {
        case SelectionHandleType.TopLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight - dy;
          x = dx + this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this.selectionState.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.TopRight:
          width = this.initialWidth + dx;
          height = this.initialHeight - dy;
          x = this.initialTranslateX;
          y = dy + this.initialTranslateY;
          this.selectionState.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.BottomLeft:
          width = this.initialWidth - dx;
          height = this.initialHeight + dy;
          x = dx + this.initialTranslateX;
          y = this.initialTranslateY;
          this.selectionState.selectionGroup.resize(x, y, width, height);
          break;
        case SelectionHandleType.BottomRight:
          width = this.initialWidth + dx;
          height = this.initialHeight + dy;
          x = this.initialTranslateX;
          y = this.initialTranslateY;
          this.selectionState.selectionGroup.resize(x, y, width, height);
          break;
      }

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this.selectionState.isResizing) {
      this.selectionState.isResizing = false;
      this.selectionState.selectionGroup = null;
      this.handleType = null;

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }
}
