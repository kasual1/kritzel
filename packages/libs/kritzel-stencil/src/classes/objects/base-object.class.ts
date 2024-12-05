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
  scale: number;
  selected: boolean = false;
  resizing: boolean = false;
  markedForRemoval: boolean = false;
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
    this.elementRef = element;
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    throw new Error('Method not implemented.');
  }

  resizeToViewportScale(): void {
    const scale = kritzelViewportState.scale;
    this.width = this.width / scale;
    this.height = this.height / scale;
  }

  centerInViewport(): void {
    const scale = kritzelViewportState.scale;
    this.translateX = (window.innerWidth / 2 - (this.width * scale) / 2 - kritzelViewportState.translateX) / scale;
    this.translateY = (window.innerHeight / 2 - (this.height * scale) / 2 - kritzelViewportState.translateY) / scale;
  }

  updateDimensions(x: number, y: number, width: number, height: number): void {

    if(width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;
  }
}
