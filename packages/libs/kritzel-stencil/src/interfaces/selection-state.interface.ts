import { KritzelBaseObject } from "../classes/objects/base-object.class";

export interface KritzelSelectionState {
	selectedObject: KritzelBaseObject<any> | null;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
}