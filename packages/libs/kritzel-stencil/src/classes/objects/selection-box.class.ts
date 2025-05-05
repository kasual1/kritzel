import { KritzelStore } from "../store.class";
import { KritzelBaseObject } from "./base-object.class";

export class KrtizelSelectionBox extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	constructor(store: KritzelStore) {
		super(store);
		this.backgroundColor = 'var(--kritzel-selection-background-color)';
		this.borderColor = 'var(--kritzel-selection-border-color)';
		this.borderWidth = 2;
		this.scale = this._store.state.scale;
		this.height = 0;
		this.width = 0;
    	this.zIndex = 9999;
	}

}
