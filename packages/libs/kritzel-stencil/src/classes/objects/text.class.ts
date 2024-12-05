import { KritzelBoundingBox } from "../../interfaces/bounding-box.interface";
import { kritzelEngineState } from "../../stores/engine.store";
import { KritzelBaseObject } from "./base-object.class";

export class KrtizelText extends KritzelBaseObject {

	value: string = 'Test';

  readonly rows: number = 1;


	constructor() {
		super();
		this.x = 0;
		this.y = 0;
		this.translateX = 0;
		this.translateY = 0;
    this.width = 50;
    this.height = 50;
		this.scale = 1;
	}

  override mount(element: HTMLElement): void {
    super.mount(element);
    this.elementRef.focus();
  }

	override isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
		return true;
	}

	handleInput(event: InputEvent): void {
		const target = event.target as HTMLTextAreaElement;
		this.value = target.value;
		this.adjustTextareaSize();
	}

	adjustTextareaSize() {
			if (this.elementRef.scrollWidth > this.elementRef.clientWidth) {
        this.width = this.elementRef.scrollWidth;
			}

      if(this.elementRef.scrollHeight > this.elementRef.clientHeight) {
        this.height = this.elementRef.scrollHeight;
      }
			this.elementRef.style.backgroundColor = 'red';

      kritzelEngineState.objects = [...kritzelEngineState.objects];
	}
}
