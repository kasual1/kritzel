import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { deselectAllObjects, kritzelEngineState } from "../../stores/engine.store";
import { KritzelBaseObject } from "../objects/base-object.class";

export class KritzelKeyHandler {

	selectionState: KritzelSelectionState;

	copiedObject: KritzelBaseObject<any> | null = null;

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
		deselectAllObjects();
	  }
	
	  private handleDelete() {
		const objectsToRemove = kritzelEngineState.objects.filter((object) => object.selected);
		kritzelEngineState.objects = kritzelEngineState.objects.filter((object) => !object.selected);
	
		for (const object of objectsToRemove) {
		  object.markedForRemoval = true;
		}
	  }
	
	  private handleCopy() {
		this.copiedObject = this.selectionState.selectedObject.copy();
		this.copiedObject.id = this.copiedObject.generateId();
		this.copiedObject.translateX += 25;
		this.copiedObject.translateY += 25;
		this.copiedObject.selected = false;
	  }
	
	  private handlePaste() {
		deselectAllObjects();
		this.selectionState.selectedObject.addOrRemove(this.copiedObject);
		this.copiedObject.selected = true;
		kritzelEngineState.objects = [...kritzelEngineState.objects, this.copiedObject];
	  }
}