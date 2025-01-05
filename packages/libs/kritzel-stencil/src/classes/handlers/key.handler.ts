import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KrtizelGroup } from "../objects/group.class";

export class KritzelKeyHandler {

	selectionState: KritzelSelectionState;

	copiedObject: KrtizelGroup | null = null;

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
		this.selectionState.selectedObject = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup))
		];
	}

	private handleDelete() {
		const toBeDeleted = this.selectionState.selectedObject.objects;

		this.selectionState.selectedObject = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects
				.filter(o => !toBeDeleted.includes(o))
				.filter(o => !(o instanceof KrtizelGroup))
		];
	}

	private handleCopy() {
		this.copiedObject = this.selectionState.selectedObject.copy() as KrtizelGroup;
	}

	private handlePaste() {
		this.selectionState.selectedObject = this.copiedObject;
		this.selectionState.selectedObject.selected = true;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelGroup)),
			...this.selectionState.selectedObject.objects,
			this.selectionState.selectedObject
		];
	}
}