import { KritzelBaseObject } from "../classes/objects/base-object.class";
import { KrtizelGroup } from "../classes/objects/group.class";

export interface KritzelSelectionState {
	selectedObject: KritzelBaseObject<any> | null;
	selectedGroup: KrtizelGroup;
	isResizing: boolean;
	isRotating: boolean;
	isDragging: boolean;
	isCtrlKeyPressed: boolean;
}