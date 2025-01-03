import { KritzelTool } from "../../components";
import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { KritzelResizeHandler } from "../handlers/resize.handler";
import { KritzelRotationHandler } from "../handlers/rotation.handler";
import { KritzelSelectionHandler } from "../handlers/selection.handler";

export class KritzelSelectionTool implements KritzelTool {
	private static instance: KritzelSelectionTool;

	name: string = 'selection';
	icon: string = 'selection';

	selectionState: KritzelSelectionState = {
		selectedObject: null,
		selectedObjects: [],
		isResizing: false,
		isRotating: false,
		isDragging: false,
	}

	selectionHandler: KritzelSelectionHandler;
	resizeHandler: KritzelResizeHandler;
	rotationHandler: KritzelRotationHandler;

	constructor() {
		if (KritzelSelectionTool.instance) {
			return KritzelSelectionTool.instance;
		}
		KritzelSelectionTool.instance = this;
		
		this.selectionHandler = new KritzelSelectionHandler(this.selectionState);
		this.resizeHandler = new KritzelResizeHandler(this.selectionState);
		this.rotationHandler = new KritzelRotationHandler(this.selectionState);
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	handleKeyDown(event: KeyboardEvent): void {
		this.selectionHandler.handleKeyDown(event);
	}

	handleKeyUp(event: KeyboardEvent): void {
		this.selectionHandler.handleKeyUp(event);
	}

	handleMouseDown(event: MouseEvent): void {
		this.selectionHandler.handleMouseDown(event);
		this.resizeHandler.handleMouseDown(event);
		this.rotationHandler.handleMouseDown(event);
	}

	handleMouseMove(event: MouseEvent): void {
		this.selectionHandler.handleMouseMove(event);
		this.resizeHandler.handleMouseMove(event);
		this.rotationHandler.handleMouseMove(event);
	}

	handleMouseUp(event: MouseEvent): void {
		this.selectionHandler.handleMouseUp(event);
		this.resizeHandler.handleMouseUp(event);
		this.rotationHandler.handleMouseUp(event);
	}

	handleWheel(_event: WheelEvent): void {
		// Do nothing
	}

}
