import { KrtizelSelectionBox } from "../classes/objects/selection-box.class";
import { KrtizelSelectionGroup } from "../classes/objects/selection-group.class";

export interface KritzelSelectionState {
	selectionBox: KrtizelSelectionBox | null;
	selectionGroup: KrtizelSelectionGroup | null;
  isSelecting: boolean;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}
