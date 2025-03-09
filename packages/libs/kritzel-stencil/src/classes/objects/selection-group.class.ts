import { kritzelViewportState } from '../../stores/viewport.store';
import { KritzelBaseObject } from './base-object.class';
import * as lodash from 'lodash-es';

export class KrtizelSelectionGroup extends KritzelBaseObject<HTMLElement> {
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
    this.scale = kritzelViewportState.scale;
    this.padding = 5;
    this.zIndex = 99999;
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
    this.objects.forEach(obj => (obj.selected = false));
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

    this.unchangedObjects.forEach(obj => {
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

    const centerX = this.translateX + this.totalWidth / 2 / this.scale;
    const centerY = this.translateY + this.totalHeight / 2 / this.scale;

    const angle = value;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    this.objects.forEach(child => {
      const unchangedChild = this.getUnchangedObject(child.id);
      const offsetX = this.getOffsetXToCenter(unchangedChild);
      const offsetY = this.getOffsetYToCenter(unchangedChild);

      const rotatedX = cos * offsetX - sin * offsetY;
      const rotatedY = sin * offsetX + cos * offsetY;

      child.translateX = centerX + rotatedX - child.totalWidth / 2 / child.scale;
      child.translateY = centerY + rotatedY - child.totalHeight / 2 / child.scale;
      child.rotation = this.objects.length === 1 ? value : value + unchangedChild.rotation;
    });
  }

  override copy(): KritzelBaseObject<HTMLElement> {
    const selectionGroup = new KrtizelSelectionGroup();
    selectionGroup.objects = this.objects.map(obj => obj.copy());
    selectionGroup.unchangedObjects = lodash.cloneDeep(selectionGroup.objects);
    selectionGroup.updateBoundingBox();
    return selectionGroup;
  }

  private updateBoundingBox() {
    if (this.objects.length === 1) {
      this.updateCornersForSingleObject();
    } else {
      this.updateCornersForMultipleObjects();
    }
  }

  private updateCornersForSingleObject() {
    const obj = this.objects[0];
    this.minX = obj.boundingBox.x / this.scale;
    this.maxX = obj.boundingBox.x / this.scale + obj.boundingBox.width;
    this.minY = obj.boundingBox.y / this.scale;
    this.maxY = obj.boundingBox.y / this.scale + obj.boundingBox.height;

    this.translateX = (this.minX - this.padding) * this.scale;
    this.translateY = (this.minY - this.padding) * this.scale;

    this.width = (this.maxX - this.minX - this.padding) * this.scale;
    this.height = (this.maxY - this.minY - this.padding) * this.scale;
  }

  private updateCornersForMultipleObjects() {
    this.minX = Math.min(...this.objects.map(obj => obj.minXRotated));
    this.maxX = Math.max(...this.objects.map(obj => obj.maxXRotated));

    this.minY = Math.min(...this.objects.map(obj => obj.minYRotated));
    this.maxY = Math.max(...this.objects.map(obj => obj.maxYRotated));

    this.translateX = this.minX - this.padding;
    this.translateY = this.minY - this.padding;

    this.width = (this.maxX - this.minX - this.padding) * this.scale;
    this.height = (this.maxY - this.minY - this.padding) * this.scale;
  }

private getOffsetXToCenter(obj: KritzelBaseObject<any>): number {
	const objCenterX = obj.translateX + obj.totalWidth / obj.scale / 2;
	const groupCenterX = this.translateX + this.totalWidth / this.scale / 2;
	return objCenterX - groupCenterX;
}

private getOffsetYToCenter(obj: KritzelBaseObject<any>): number {
	const objCenterY = obj.translateY + obj.totalHeight / obj.scale / 2;
	const groupCenterY = this.translateY + this.totalHeight / this.scale / 2;
	return objCenterY - groupCenterY;
}

  private getUnchangedObject(objectId: string): KritzelBaseObject<any> {
    return this.unchangedObjects.find(obj => obj.id === objectId);
  }
}
