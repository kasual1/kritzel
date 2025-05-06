import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { KritzelObject } from '../../interfaces/object.interface';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelSerializable } from '../../interfaces/serializable.interface';
import { KritzelStore } from '../store.class';
import { ObjectHelper } from '../../helpers/object.helper';

export class KritzelBaseObject<T = HTMLElement> implements KritzelObject<T>, KritzelSerializable {
  __class__: string = this.constructor.name;
  id: string;
  visible: boolean = true;
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  height: number;
  width: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number = 0;
  opacity: number = 1;
  padding: number = 0;
  scale: number;
  selected: boolean = false;
  resizing: boolean = false;
  rotation: number = 0;
  markedForRemoval: boolean = false;
  isMounted: boolean = false;
  zIndex: number = 0;

  debugInfoVisible: boolean = false;

  readonly _store: KritzelStore;
  _elementRef: T;

  get totalWidth(): number {
    return this.width + this.padding * 2;
  }

  get totalHeight(): number {
    return this.height + this.padding * 2;
  }

  set elementRef(element: T) {
    this._elementRef = element;
  }

  get elementRef(): T {
    return this._elementRef;
  }

  get boundingBox(): KritzelBoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      z: this.scale,
      width: this.totalWidth / this.scale,
      height: this.totalHeight / this.scale,
      depth: 0,
    };
  }

  get rotatedBoundingBox(): KritzelBoundingBox {
    return {
      x: this.minXRotated,
      y: this.minYRotated,
      z: this.scale,
      width: this.maxXRotated - this.minXRotated,
      height: this.maxYRotated - this.minYRotated,
      depth: 0,
    };
  }

  get rotatedPolygon(): KritzelPolygon {
    const cx = (this.translateX + this.totalWidth / 2 / this.scale);
    const cy = (this.translateY + this.totalHeight / 2 / this.scale);
    const angle = this.rotation;

    const adjustedWidth = this.totalWidth / this.scale;
    const adjustedHeight = this.totalHeight / this.scale;

    const corners = {
      topLeft: { x: this.translateX, y: this.translateY },
      topRight: { x: this.translateX + adjustedWidth, y: this.translateY },
      bottomRight: { x: this.translateX + adjustedWidth, y: this.translateY + adjustedHeight },
      bottomLeft: { x: this.translateX, y: this.translateY + adjustedHeight },
    };

    const rotatedCorners = Object.keys(corners).reduce((acc, key) => {
      const corner = corners[key];
      const rotatedX = Math.cos(angle) * (corner.x - cx) - Math.sin(angle) * (corner.y - cy) + cx;
      const rotatedY = Math.sin(angle) * (corner.x - cx) + Math.cos(angle) * (corner.y - cy) + cy;
      acc[key] = { x: rotatedX, y: rotatedY };
      return acc;
    }, {});

    return rotatedCorners as KritzelPolygon;
  }
  

  get minXRotated(): number {
    const corners = [
      this.rotatedPolygon.topLeft.x,
      this.rotatedPolygon.topRight.x,
      this.rotatedPolygon.bottomRight.x,
      this.rotatedPolygon.bottomLeft.x,
    ];

    return Math.min(...corners);
  }

  get minYRotated(): number {
    const corners = [
      this.rotatedPolygon.topLeft.y,
      this.rotatedPolygon.topRight.y,
      this.rotatedPolygon.bottomRight.y,
      this.rotatedPolygon.bottomLeft.y,
    ];

    return Math.min(...corners);
  }

  get maxXRotated(): number {
    const corners = [
      this.rotatedPolygon.topLeft.x,
      this.rotatedPolygon.topRight.x,
      this.rotatedPolygon.bottomRight.x,
      this.rotatedPolygon.bottomLeft.x,
    ];

    return Math.max(...corners);
  }

  get maxYRotated(): number {
    const corners = [
      this.rotatedPolygon.topLeft.y,
      this.rotatedPolygon.topRight.y,
      this.rotatedPolygon.bottomRight.y,
      this.rotatedPolygon.bottomLeft.y,
    ];

    return Math.max(...corners);
  }

  get transformationMatrix(): string {
    const scale = 1 / this.scale;
    const translateX = this.translateX;
    const translateY = this.translateY;

    return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
  }

  get rotationDegrees(): number {
    return this.rotation * (180 / Math.PI);
  }

  constructor(store: KritzelStore) {
    this._store = store;
    this.id = this.generateId();
  }

  mount(element: T): void {
    if (this.isMounted) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
  }

  generateId(): string {
    return ObjectHelper.generateUUID();
  }

  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    return true;
  }

  centerInViewport(): void {
    const scale = this._store.state.scale;
    this.translateX = (this._store.state.viewportWidth / 2 - this.totalWidth / 2 - this._store.state.translateX) / scale;
    this.translateY = (this._store.state.viewportHeight / 2 - this.totalHeight / 2 - this._store.state.translateY) / scale;
  }

  move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._store.state.scale;
    const deltaY = (startY - endY) / this._store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;
  }

  resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;
  }

  rotate(value: number): void {
    this.rotation = value;
  }

  copy(): KritzelBaseObject<T> {
    const copiedObject: KritzelBaseObject<T> = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.id = this.generateId();
    copiedObject.isMounted = true;
    return copiedObject;
  }

  revive(object: any): KritzelBaseObject<T> {
    Object.assign(this, object);
    return this;
  }

}
