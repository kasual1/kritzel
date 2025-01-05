import { KritzelBaseObject } from "./base-object.class";

export class KrtizelSelectionBox extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	constructor() {
		super();
		this.backgroundColor = 'blue';
		this.opacity = 0.5;
		this.scale = 1;
		this.height = 0;
		this.width = 0;
	}

}