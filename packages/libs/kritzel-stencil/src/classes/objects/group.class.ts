import { KritzelSelectionState } from "../../interfaces/selection-state.interface";
import { kritzelViewportState } from "../../stores/viewport.store";
import { KritzelBaseObject } from "./base-object.class";

export class KrtizelGroup extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];

	minX: number;
	maxX: number;

	minY: number;
	maxY: number;

	private initialOffsets: { child: KritzelBaseObject<any>, offsetX: number, offsetY: number }[] = [];

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

	private updateBoundingBox() {
		this.minX = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateX), this.objects[0].translateX);
		this.maxX = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateX + obj.totalWidth), this.objects[0].translateX + this.objects[0].totalWidth);

		this.minY = this.objects.reduce((acc, obj) => Math.min(acc, obj.translateY), this.objects[0].translateY);
		this.maxY = this.objects.reduce((acc, obj) => Math.max(acc, obj.translateY + obj.totalHeight), this.objects[0].translateY + this.objects[0].totalHeight);

		this.translateX = this.minX - this.padding;
		this.translateY = this.minY - this.padding;

		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;

		const groupCenterX = this.translateX + this.totalWidth / 2;
		const groupCenterY = this.translateY + this.totalHeight / 2;

		this.initialOffsets = this.objects.map(child => ({
			child,
			offsetX: child.translateX + child.width / 2 - groupCenterX,
			offsetY: child.translateY + child.height / 2 - groupCenterY,
		}));
	}


	addOrRemove(object: KritzelBaseObject<any>) {
		const index = this.objects.findIndex(obj => obj.id === object.id);
		if (index === -1) {
			this.objects.push(object);
		} else {
			this.objects.splice(index, 1);
		}

		this.updateBoundingBox();
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
		const widthScaleFactor = width / this.width;
		const heightScaleFactor = height / this.height;

		const deltaX = x - this.translateX;
		const deltaY = y - this.translateY;

		this.objects.forEach(obj => {
			const updatedWidth = obj.width * widthScaleFactor;
			const updatedHeight = obj.height * heightScaleFactor;
			const updatedX = obj.translateX * widthScaleFactor + deltaX;
			const updatedY = obj.translateY * heightScaleFactor + deltaY;
			obj.resize(updatedX, updatedY, updatedWidth, updatedHeight);
		});

		this.updateBoundingBox();
	}

	override rotate(value: number): void {
		this.rotation = value;


		const groupCenterX = this.translateX + this.totalWidth / 2;
		const groupCenterY = this.translateY + this.totalHeight / 2;

		const angle = value; 
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		this.initialOffsets.forEach(({ child, offsetX, offsetY }) => {
			const rotatedX = cos * offsetX - sin * offsetY + groupCenterX;
			const rotatedY = sin * offsetX + cos * offsetY + groupCenterY;

			child.translateX = rotatedX - child.width / 2;
			child.translateY = rotatedY - child.height / 2;
			child.rotation = value;
		});
	}

}