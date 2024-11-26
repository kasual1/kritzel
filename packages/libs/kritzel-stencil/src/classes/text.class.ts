import { KritzelBoundingBox } from "../interfaces/bounding-box.interface";
import { KritzelObjectBase } from "./object.class";

export class KrtizelText extends KritzelObjectBase {

	elementRef: HTMLElement;

	value: string = 'Test';

	constructor() {
		super();
		this.x = 0;
		this.y = 0;
		this.translateX = 0;
		this.translateY = 0;
		this.scale = 1;

		console.log(this.elementRef);
	}

	override isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
		return true;
	}

	handleInput(event: InputEvent): void {
		debugger;
		const target = event.target as HTMLTextAreaElement;
		this.value = target.value;
		this.adjustTextareaSize();
	}

	adjustTextareaSize() {
		debugger;
		if (this.elementRef) {

			if (this.elementRef.scrollHeight > this.elementRef.clientHeight) {
				this.elementRef.style.height = `${this.elementRef.scrollHeight}px`;
			}

			if (this.elementRef.scrollWidth > this.elementRef.clientWidth) {
				this.elementRef.style.width = `${this.elementRef.scrollWidth}px`;
			}

			this.elementRef.style.backgroundColor = 'red';
		}
	}
}