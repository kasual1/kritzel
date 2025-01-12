import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KrtizelSelectionGroup } from "../objects/selection-group.class";

export class KritzelKeyHandler {

	selectionState: KritzelSelectionState;

	copiedObject: KrtizelSelectionGroup | null = null;

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
		this.selectionState.selectionGroup = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup))
		];
	}

	private handleDelete() {
		const toBeDeleted = this.selectionState.selectionGroup.objects;

		this.selectionState.selectionGroup = null;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects
				.filter(o => !toBeDeleted.includes(o))
				.filter(o => !(o instanceof KrtizelSelectionGroup))
		];
	}

	private handleCopy() {
		this.copiedObject = this.selectionState.selectionGroup.copy() as KrtizelSelectionGroup;
	}

	private handlePaste() {
		this.selectionState.selectionGroup = this.copiedObject;
		this.selectionState.selectionGroup.selected = true;
    this.copiedObject = this.selectionState.selectionGroup.copy() as KrtizelSelectionGroup;

		kritzelEngineState.objects = [
			...kritzelEngineState.objects.filter(o => !(o instanceof KrtizelSelectionGroup)),
			...this.selectionState.selectionGroup.objects,
			this.selectionState.selectionGroup
		];
	}
}
