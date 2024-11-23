import { KritzelBoundingBox } from "../interfaces/bounding-box.interface";
import { KritzelObject } from "../interfaces/object.interface";

export class KritzelObjectBase implements KritzelObject{
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

  get boundingBox(): KritzelBoundingBox {
    return {
      x: this.translateX,
      y: this.translateY,
      width: this.width / this.scale,
      height: this.height / this.scale,
    };
  }

  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    throw new Error("Method not implemented.");
  }
  
  isPointInBoundingBox(x: number, y: number): boolean {
    const boundingBox = this.boundingBox;
    return (
      x >= boundingBox.x &&
      x <= boundingBox.x + boundingBox.width &&
      y >= boundingBox.y &&
      y <= boundingBox.y + boundingBox.height
    );
  }
}
