import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KritzelBaseObject } from "./base-object.class";

export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {

	img: HTMLImageElement;

	constructor(img: HTMLImageElement) {
		super();
		this.img = img;
		this.x = 0;
		this.y = 0;
		this.translateX = 0;
		this.translateY = 0;
		this.width = img.width;
		this.height = img.height;
		this.scale = 1;
	}

	override isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
		return true;
	}

  override updateDimensions(x: number, y: number, width: number, height: number): void {

    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleFactor = height / this.height;

    this.width = this.width * scaleFactor;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }
}
