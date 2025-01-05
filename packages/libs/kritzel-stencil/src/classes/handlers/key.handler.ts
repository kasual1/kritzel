import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KrtizelSelection } from "../objects/selection.class";

export class KritzelKeyHandler {

	selectionState: KritzelSelectionState;

	copiedObject: KrtizelSelection | null = null;

	constructor(selectionState: KritzelSelectionState) {
		this.selectionState = selectionState;
	}

	handleKeyDown(event: KeyboardEvent): void {
		this.selectionState.isCtrlKeyPressed = event.ctrlKey;

		if (event.key === 'Escape') {
			this.handleEscape();
		}

		if (event.key === 'Delete') {
			this.handleDelete();
		}

		if (event.key === 'c' && event.ctrlKey) {
			this.handleCopy();
		}

		if (event.key === 'v' && event.ctrlKey) {
			this.handlePaste();
		}

	}

	handleKeyUp(event: KeyboardEvent): void {
		this.selectionState.isCtrlKeyPressed = event.ctrlKey;
	}

	private handleEscape() {
		this.selectionState.selection = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelection))
		];
	}

	private handleDelete() {
		const toBeDeleted = this.selectionState.selection.objects;

		this.selectionState.selection = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects
				.filter(o => !toBeDeleted.includes(o))
				.filter(o => !(o instanceof KrtizelSelection))
		];
	}

	private handleCopy() {
		this.copiedObject = this.selectionState.selection.copy() as KrtizelSelection;
	}

	private handlePaste() {
		this.selectionState.selection = this.copiedObject;
		this.selectionState.selection.selected = true;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelection)),
			...this.selectionState.selection.objects,
			this.selectionState.selection
		];
	}
}