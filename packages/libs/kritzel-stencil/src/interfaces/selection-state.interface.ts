import { KrtizelSelection } from "../classes/objects/selection.class";

export interface KritzelSelectionState {
	selection: KrtizelSelection | null;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}