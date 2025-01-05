import { kritzelViewportState } from "../../stores/viewport.store";
import { KritzelBaseObject } from "./base-object.class";
import * as lodash from 'lodash-es';

export class KrtizelGroup extends KritzelBaseObject<HTMLElement> {

	objects: KritzelBaseObject<any>[] = [];
	unchangedObjects: KritzelBaseObject<any>[] = [];

	minX: number;
	maxX: number;

	minY: number;
	maxY: number;

	constructor() {
		super();
		this.backgroundColor = 'rebeccapurple';
		this.opacity = 0.5;
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

		this.unchangedObjects = lodash.cloneDeep(this.objects);
		this.updateBoundingBox();
	}

	deselectAllChildren() {
		this.objects.forEach(obj => obj.selected = false);
	}

	override move(startX: number, startY: number, endX: number, endY: number): void {
		const deltaX = (startX - endX) / kritzelViewportState.scale;
		const deltaY = (startY - endY) / kritzelViewportState.scale;

		this.translateX += deltaX;
		this.translateY += deltaY;

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

		this.objects.forEach(child => {
			const unchangedChild = this.getUnchangedObject(child.id);
			const offsetX = this.getOffsetXToGroupCenter(unchangedChild);
			const offsetY = this.getOffsetYToGroupCenter(unchangedChild);

			const rotatedX = cos * offsetX - sin * offsetY + groupCenterX;
			const rotatedY = sin * offsetX + cos * offsetY + groupCenterY;

			child.translateX = rotatedX - child.width / 2;
			child.translateY = rotatedY - child.height / 2;
			child.rotation = value + unchangedChild.rotation;
		});
	}

	override copy(): KritzelBaseObject<HTMLElement> {
		const group = new KrtizelGroup();
		group.objects = this.objects.map(obj => obj.copy());
		group.unchangedObjects = lodash.cloneDeep(group.objects);
		group.updateBoundingBox();
		return group;
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
	}

	private getOffsetXToGroupCenter(obj: KritzelBaseObject<any>): number {
		return obj.translateX + obj.width / 2 - this.translateX - this.totalWidth / 2;
	}

	private getOffsetYToGroupCenter(obj: KritzelBaseObject<any>): number {
		return obj.translateY + obj.height / 2 - this.translateY - this.totalHeight / 2;
	}

	private getUnchangedObject(objectId: string): KritzelBaseObject<any> {
		return this.unchangedObjects.find(obj => obj.id === objectId);
	}

}