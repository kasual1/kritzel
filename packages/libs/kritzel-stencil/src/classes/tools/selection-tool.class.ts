import { KritzelTool } from "../../components";
import { KritzelResizeHandler } from "../handlers/resize.handler";
import { KritzelSelectionHandler } from "../handlers/selection.handler";
export class KritzelSelectionTool implements KritzelTool {
	name: string = 'selection';
	icon: string = 'selection';

  selectionHandler: KritzelSelectionHandler;
  resizeHandler: KritzelResizeHandler;

	constructor() {
    this.selectionHandler = new KritzelSelectionHandler();
    this.resizeHandler = new KritzelResizeHandler();
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
	}

	handleKeyDown(event: KeyboardEvent): void {
		this.selectionHandler.handleKeyDown(event);
	}

	handleMouseDown(event: MouseEvent): void {
		this.selectionHandler.handleMouseDown(event);
    this.resizeHandler.handleMouseDown(event);
	}

	handleMouseMove(event: MouseEvent): void {
		this.selectionHandler.handleMouseMove(event);
    this.resizeHandler.handleMouseMove(event);
	}

	handleMouseUp(event: MouseEvent): void {
		this.selectionHandler.handleMouseUp(event);
    this.resizeHandler.handleMouseUp(event);
	}

	handleWheel(_event: WheelEvent): void {
		// Do nothing
	}

}
