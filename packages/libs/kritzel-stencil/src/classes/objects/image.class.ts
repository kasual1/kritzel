import { KritzelStore } from "../store.class";
import { KritzelBaseObject } from "./base-object.class";

export class KritzelImage extends KritzelBaseObject<HTMLImageElement> {

	img: HTMLImageElement;

	override debugInfoVisible: boolean = true;

	constructor(store: KritzelStore, img?: HTMLImageElement) {
		super(store);
		this.img = img;
		this.x = 0;
		this.y = 0;
		this.translateX = 0;
		this.translateY = 0;
		this.width = img.width;
		this.height = img.height;
		this.scale = this._store.state.scale;
	}

	override resize(x: number, y: number, width: number, height: number): void {

		if (width <= 1 || height <= 1) {
			return;
		}

		const scaleFactor = (height / this.height);

		this.width = this.width * scaleFactor;
		this.height = this.height * scaleFactor;
		this.translateX = x;
		this.translateY = y;
	}
}
