import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
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
}
