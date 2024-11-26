import { KritzelBoundingBox } from "../interfaces/bounding-box.interface";
import { KritzelObject } from "../interfaces/object.interface";
import { kritzelViewportState } from "../stores/viewport.store";

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
  markedForRemoval: boolean = false;

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
    throw new Error("Method not implemented.");
  }

  isPointInBoundingBox(x: number, y: number): boolean {
    const boundingBox = this.boundingBox;

    const adjustedX = (this.boundingBox.x + kritzelViewportState.translateX) / kritzelViewportState.scale;
    const adjustedY = (this.boundingBox.y + kritzelViewportState.translateY) / kritzelViewportState.scale;
    const adjustedWidth = boundingBox.width / kritzelViewportState.scale;
    const adjustedHeight = boundingBox.height / kritzelViewportState.scale;

    const adjustedBoundingBox = {
      x: adjustedX,
      y: adjustedY,
      width: adjustedWidth,
      height: adjustedHeight,
    }

    return (
      x >= adjustedBoundingBox.x &&
      x <= adjustedBoundingBox.x + adjustedBoundingBox.width &&
      y >= adjustedBoundingBox.y &&
      y <= adjustedBoundingBox.y + adjustedBoundingBox.height
    );
  }

  centerInViewport(): void {
    this.translateX = (window.innerWidth / 2 - this.width / 2) - kritzelViewportState.translateX;
    this.translateY = (window.innerHeight / 2 - this.height / 2) - kritzelViewportState.translateY;
  }

}
