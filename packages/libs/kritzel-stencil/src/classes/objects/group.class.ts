import { KritzelBaseObject } from "./base-object.class";

export class KrtizelGroup extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	minX: number;
	maxX: number;

	minY: number;
	maxY: number;

	constructor(objects: KritzelBaseObject<any>[] = []) {
		super();
		this.backgroundColor = 'rebeccapurple';
		this.opacity = 0.5;
		this.objects = objects;
		this.scale = 1;
		this.padding = 5;
	}

	override get totalWidth(): number {
		if(this.objects.length === 0) return 0;

		return (this.maxX - this.minX) + this.padding * 2;
	}

	override get totalHeight(): number {
		if(this.objects.length === 0) return 0;

		return (this.maxY - this.minY) + this.padding * 2;
	}

	get length(): number {
		return this.objects.length;
	}

	addOrRemove(object: KritzelBaseObject<any>) {
		const index = this.objects.findIndex(obj => obj.id === object.id);
		if(index === -1) {
			this.objects.push(object);
		} else {
			this.objects.splice(index, 1);
		}

		this.minX = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateX), this.objects[0].translateX);
		this.maxX = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateX + obj.totalWidth), this.objects[0].translateX + this.objects[0].totalWidth);

		this.minY = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateY), this.objects[0].translateY);
		this.maxY = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateY + obj.totalHeight), this.objects[0].translateY + this.objects[0].totalHeight);

		this.translateX = this.minX - this.padding;
		this.translateY = this.minY - this.padding;
	}

	clear() {
		this.objects = [];
	}

}