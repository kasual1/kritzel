import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
import { KritzelObject } from "../../interfaces/object.interface";
import { KritzelSelection } from "../../interfaces/selection.interface";
import { kritzelViewportState } from "../../stores/viewport.store";

export class KritzelBaseObject<T = HTMLElement> implements KritzelObject<T> {
  id: string;
  visible: boolean = true;
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  height: number;
  width: number;
  backgroundColor: string;
  opacity: number = 1;
  padding: number = 0;
  scale: number;
  selected: boolean = false;
  resizing: boolean = false;
  rotation: number = 0;
  markedForRemoval: boolean = false;
  isMounted: boolean = false;

  _elementRef: T;

  selection: KritzelSelection = {
    stroke: {
      color: '#009999',
      size: 1,
      style: 'solid'
    },
    handles: {
      color: 'black',
      size: 5
    }
  };

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
      width: this.width / this.scale,
      height: this.height / this.scale,
    };
  }

  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
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

  constructor() {
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
    return Math.random().toString(36).substr(2, 9);
  }

  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    return true;
  }

  centerInViewport(): void {
    const scale = kritzelViewportState.scale;
    this.translateX = (((window.innerWidth / 2) - (this.totalWidth / 2)) - kritzelViewportState.translateX) / scale;
    this.translateY = (((window.innerHeight / 2) - (this.totalHeight / 2)) - kritzelViewportState.translateY) / scale;
  }

  move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / kritzelViewportState.scale;
    const deltaY = (startY - endY) / kritzelViewportState.scale;

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
    const copiedObject = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.isMounted = true;
    copiedObject.translateX += 25;
    copiedObject.translateY += 25;
    return copiedObject;
  }

}
