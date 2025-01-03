import { KritzelBaseObject } from "./base-object.class";

export class KrtizelGroup extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	constructor(objects: KritzelBaseObject<any>[]) {
		super();
		this.objects = objects;
		this.backgroundColor = 'rebeccapurple';
	}

	override get totalWidth(): number {
		return 100;
	}

	override get totalHeight(): number {
		return 100;
	}

}