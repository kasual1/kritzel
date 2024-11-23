import { KritzelBoundingBox } from "../interfaces/bounding-box.interface";
import { KritzelObjectBase } from "./object.class";

export class KritzelImage extends KritzelObjectBase {

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

	get transformationMatrix(): string {
		const scale = 1 / this.scale;
		const translateX = this.translateX;
		const translateY = this.translateY;

		return `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
	}

	override isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
		return true;
	}
}