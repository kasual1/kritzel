import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelViewportState } from "../../stores/viewport.store";
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

	get length(): number {
		return this.objects.length;
	}

	addOrRemove(object: KritzelBaseObject<any>) {
		const index = this.objects.findIndex(obj => obj.id === object.id);
		if (index === -1) {
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

		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
	}

	clear() {
		this.objects = [];
	}

	deselectAllChildren() {
		this.objects.forEach(obj => obj.selected = false);
	}

	override move(event: MouseEvent, dragStartX: number, dragStartY: number, selectionState: KritzelSelectionState): void {
		super.move(event, dragStartX, dragStartY, selectionState);

		const deltaX = (event.clientX - dragStartX) / kritzelViewportState.scale;
		const deltaY = (event.clientY - dragStartY) / kritzelViewportState.scale;

		this.objects.forEach(obj => {
			obj.translateX += deltaX;
			obj.translateY += deltaY;
		});
	}

	override resize(x: number, y: number, width: number, height: number): void {
		this.objects.forEach(obj => {
			obj.resize(x, y, width, height);
		});

		this.minX = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateX), this.objects[0].translateX);
		this.maxX = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateX + obj.totalWidth), this.objects[0].translateX + this.objects[0].totalWidth);

		this.minY = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateY), this.objects[0].translateY);
		this.maxY = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateY + obj.totalHeight), this.objects[0].translateY + this.objects[0].totalHeight);

		this.translateX = this.minX - this.padding;
		this.translateY = this.minY - this.padding;

		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
	}

	override rotate(value: number): void {
		 // Calculate the center of the group
		 const centerX = this.translateX + this.width / 2;
		 const centerY = this.translateY + this.height / 2;
	 
		 this.objects.forEach(child => {
			// Calculate the child's position relative to the group's center
			let relativeX = child.translateX - centerX;
			let relativeY = child.translateY - centerY;
		
			// Rotate the relative coordinates
			let rotatedX = relativeX * Math.cos(value) - relativeY * Math.sin(value);
			let rotatedY = relativeX * Math.sin(value) + relativeY * Math.cos(value);
		
			// Calculate the child's new absolute position
			child.translateX = centerX + rotatedX;
			child.translateY = centerY + rotatedY;
		
			// Rotate the child itself by the same value
			child.rotation += value;
		 });
	 
		 // Call the base class rotate method (if necessary)
		this.rotation += value;
	}

}