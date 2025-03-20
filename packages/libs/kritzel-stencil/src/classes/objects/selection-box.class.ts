import { KritzelStore } from "../../stores/store";
import { kritzelViewportState } from "../../stores/viewport.store";
import { KritzelBaseObject } from "./base-object.class";

export class KrtizelSelectionBox extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	constructor(store: KritzelStore) {
		super(store);
		this.backgroundColor = '#009999';
		this.opacity = 0.5;
		this.scale = kritzelViewportState.scale;
		this.height = 0;
		this.width = 0;
    	this.zIndex = 99999;
	}

}
