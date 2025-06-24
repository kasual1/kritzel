import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelStore } from '../store.class';
import { KritzelReviver } from '../reviver.class';
import { KritzelBaseObject } from './base-object.class';
export class KritzelSelectionGroup extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionGroup';

  objects: KritzelBaseObject<any>[] = [];
  unchangedObjects: KritzelBaseObject<any>[] = [];

  minX: number;
  maxX: number;

  minY: number;
  maxY: number;

  get length(): number {
    return this.objects.length;
  }

  static override create(store: KritzelStore): KritzelSelectionGroup {
    const object = new KritzelSelectionGroup();

    object._store = store;
    object.id = object.generateId();
    object.scale = store.state.scale;
    object.zIndex = 99999;

    return object;
  }

  addOrRemove(object: KritzelBaseObject<any>) {
    debugger;
    const index = this.objects.findIndex(obj => obj.id === object.id);
    if (index === -1) {
      this.objects.push(object);
    } else {
      this.objects.splice(index, 1);
    }

    this.unchangedObjects = ObjectHelper.clone(this.objects);
    this.refreshObjectDimensions();
  }

  deselectAllChildren() {
    this.objects.forEach(obj => (obj.selected = false));
  }

  updatePosition(x: number, y: number) {
    this.objects.forEach(obj => {
      const deltaX = obj.translateX - this.translateX;
      const deltaY = obj.translateY - this.translateY;
      obj.translateX = x + deltaX;
      obj.translateY = y + deltaY;
      this._store.state.objectsOctree.update(obj);
    });

    this.unchangedObjects.forEach(obj => {
      const deltaX = obj.translateX - this.translateX;
      const deltaY = obj.translateY - this.translateY;
      obj.translateX = x + deltaX;
      obj.translateY = y + deltaY;
    });

    this.translateX = x;
    this.translateY = y;

    this._store.state.objectsOctree.update(this);
  }

  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._store.state.scale;
    const deltaY = (startY - endY) / this._store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;
    this._store.state.objectsOctree.update(this);

    this.objects.forEach(obj => {
      obj.translateX += deltaX;
      obj.translateY += deltaY;
      this._store.state.objectsOctree.update(obj);
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

    this.objects.forEach(child => {
      const updatedWidth = child.width * widthScaleFactor;
      const updatedHeight = child.height * heightScaleFactor;

      const updatedX = child.translateX + deltaX + (child.translateX - this.translateX) * (widthScaleFactor - 1);
      const updatedY = child.translateY + deltaY + (child.translateY - this.translateY) * (heightScaleFactor - 1);

      child.resize(updatedX, updatedY, updatedWidth, updatedHeight);

      this._store.state.objectsOctree.update(child);
    });

    this.refreshObjectDimensions();
    this.unchangedObjects = ObjectHelper.clone(this.objects);
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

      this._store.state.objectsOctree.update(child);
    });
  }

  override copy(): KritzelBaseObject<HTMLElement> {
    const selectionGroup = KritzelSelectionGroup.create(this._store);

    let currentZIndex = this._store.currentZIndex;

    this.objects.forEach(obj => {
      const copiedObject = obj.copy() as KritzelBaseObject<any>;
      copiedObject.zIndex = currentZIndex;
      selectionGroup.addOrRemove(copiedObject);
      currentZIndex++;
    });

    selectionGroup.unchangedObjects = ObjectHelper.clone(selectionGroup.objects);

    if (this.objects.length === 1) {
      selectionGroup.rotation = this.objects[0].rotation;
    }

    return selectionGroup;
  }

  refreshObjectDimensions() {
    if (this.objects.length === 1) {
      const obj = this.objects[0];
      this.minX = obj.boundingBox.x / this.scale;
      this.maxX = obj.boundingBox.x / this.scale + obj.boundingBox.width;
      this.minY = obj.boundingBox.y / this.scale;
      this.maxY = obj.boundingBox.y / this.scale + obj.boundingBox.height;

      this.translateX = (this.minX - this.padding) * this.scale;
      this.translateY = (this.minY - this.padding) * this.scale;

      this.width = (this.maxX - this.minX - this.padding) * this.scale;
      this.height = (this.maxY - this.minY - this.padding) * this.scale;
    } else {
      this.minX = Math.min(...this.objects.map(obj => obj.minXRotated));
      this.maxX = Math.max(...this.objects.map(obj => obj.maxXRotated));

      this.minY = Math.min(...this.objects.map(obj => obj.minYRotated));
      this.maxY = Math.max(...this.objects.map(obj => obj.maxYRotated));

      this.translateX = this.minX - this.padding;
      this.translateY = this.minY - this.padding;

      this.width = (this.maxX - this.minX - this.padding) * this.scale;
      this.height = (this.maxY - this.minY - this.padding) * this.scale;
    }

    this._store.state.objectsOctree.update(this);
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
    const obj = this.unchangedObjects.find(obj => obj.id === objectId);
    const reviver = new KritzelReviver(this._store);
    return reviver.revive(obj);
  }
}
