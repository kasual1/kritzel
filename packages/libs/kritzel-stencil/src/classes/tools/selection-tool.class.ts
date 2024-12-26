import { KritzelTool } from "../../components";
import { KritzelResizeHandler } from "../handlers/resize.handler";
import { KritzelRotationHandler } from "../handlers/rotation.handler";
import { KritzelSelectionHandler } from "../handlers/selection.handler";
export class KritzelSelectionTool implements KritzelTool {
	name: string = 'selection';
	icon: string = 'selection';

	selectionHandler: KritzelSelectionHandler;
	resizeHandler: KritzelResizeHandler;
	rotationHandler: KritzelRotationHandler;

	constructor() {
		this.selectionHandler = new KritzelSelectionHandler();
		this.resizeHandler = new KritzelResizeHandler();
		this.rotationHandler = new KritzelRotationHandler();
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
	}

	handleKeyDown(event: KeyboardEvent): void {
		this.selectionHandler.handleKeyDown(event);
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
