import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
import { KritzelObject } from "../../interfaces/object.interface";
import { KritzelSelection } from "../../interfaces/selection.interface";
import { kritzelViewportState } from "../../stores/viewport.store";

export class KritzelBaseObject implements KritzelObject {
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

  get boundingBox(): KritzelBoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      width: this.width / this.scale,
      height: this.height / this.scale,
    };
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

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    throw new Error('Method not implemented.');
  }

  centerInViewport(): void {
    this.translateX = window.innerWidth / 2 - this.width / 2 - kritzelViewportState.translateX;
    this.translateY = window.innerHeight / 2 - this.height / 2 - kritzelViewportState.translateY;
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
