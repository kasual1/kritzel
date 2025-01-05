import { KrtizelSelectionGroup } from "../classes/objects/selection-group.class";

export interface KritzelSelectionState {
	selectionGroup: KrtizelSelectionGroup | null;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}