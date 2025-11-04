import { KritzelSelectionGroup } from "../classes/objects/selection-group.class";

export interface KritzelSelectionState {
	selectionGroup: KritzelSelectionGroup | null;
  	isSelecting: boolean;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}
