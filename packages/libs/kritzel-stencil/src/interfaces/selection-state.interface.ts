import { KrtizelGroup } from "../classes/objects/group.class";

export interface KritzelSelectionState {
	selectedObject: KrtizelGroup | null;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}