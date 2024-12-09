import { KritzelBoundingBox } from '../../interfaces/bounding-box.interface';
import { kritzelEngineState } from '../../stores/engine.store';
import { KritzelBaseObject } from './base-object.class';

export class KrtizelText extends KritzelBaseObject<HTMLTextAreaElement> {
  value: string = '';

  fontSize: number = 46;

  readonly rows: number = 1;

  constructor() {
    super();
    this.translateX = 0;
    this.translateY = 0;
    this.width = 50;
    this.height = 50;
    this.scale = 1;
  }

  override mount(element: HTMLTextAreaElement): void {
    if (this.isMounted) {
      return;
    }
    super.mount(element);

    requestAnimationFrame(() => {
      this.elementRef.focus();
    });
  }

  override isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    return true;
  }

  override updateDimensions(x: number, y: number, width: number, height: number): void {
    
    if(width <= 1 || height <= 1) {
      return;
    }
     
    const scaleFactor = height / this.height;
    
    this.fontSize = this.fontSize * scaleFactor;
    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    kritzelEngineState.objects = [...kritzelEngineState.objects];
  }

  handleInput(event: InputEvent): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.adjustTextareaSize();
  }

  adjustTextareaSize() {
    if (this.elementRef) {
      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.whiteSpace = 'pre';
      span.style.visibility = 'hidden';
      span.style.fontSize = window.getComputedStyle(this.elementRef).fontSize;
      span.style.fontFamily = window.getComputedStyle(this.elementRef).fontFamily;
      span.textContent = this.elementRef.value;

      document.body.appendChild(span);
      const textWidth = span.offsetWidth;
      document.body.removeChild(span);

      this.width = textWidth;

      this.elementRef.style.height = 'auto';
      this.height = this.elementRef.scrollHeight;

      this.elementRef.style.width = `${this.width}px`;
      this.elementRef.style.height = `${this.height}px`;
      this.elementRef.style.minWidth = '0';
      this.elementRef.style.minHeight = '0';

      this.elementRef.style.backgroundColor = 'red';

      kritzelEngineState.objects = [...kritzelEngineState.objects];
    }
  }

}
