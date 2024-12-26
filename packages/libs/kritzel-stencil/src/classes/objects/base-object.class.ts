import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
import { KritzelObject } from "../../interfaces/object.interface";
import { KritzelSelection } from "../../interfaces/selection.interface";
import { kritzelEngineState } from "../../stores/engine.store";
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

  constructor() {
    this.id = this.generateId();
  }

  mount(element: T): void {
    if(this.isMounted) {
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

  resize(x: number, y: number, width: number, height: number): void {

    if(width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  rotate(degrees: number): void {
    console.log('rotate', degrees);
  }

  copy(): KritzelBaseObject<T> {
    const copiedObject = Object.create(Object.getPrototypeOf(this));
    Object.assign(copiedObject, this);
    copiedObject.elementRef = (this.elementRef as HTMLElement).cloneNode(true) as HTMLElement;
    copiedObject.isMounted = true;
    copiedObject.translateX += 25;
    copiedObject.translateY += 25;
    return copiedObject;
  }
}
