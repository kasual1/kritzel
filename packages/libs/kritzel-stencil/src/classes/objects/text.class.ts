import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelText extends KritzelBaseObject<HTMLTextAreaElement> {
  value: string = '';

  fontFamily: string = 'Arial';

  fontSize: number = 16;

  initialWidth: number = 2;

  initalHeight: number = this.lineHeight;

	override debugInfoVisible: boolean = true;

  readonly rows: number = 1;

  get lineHeight(): number {
    return this.fontSize * 1.2;
  }

  get isReadonly(): boolean {
    return this._store.state.activeTool?.name !== 'text';
  }

  constructor(store: KritzelStore, fontSize: number, fontFamily: string) {
    super(store);
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.translateX = 0;
    this.translateY = 0;
    this.width = this.initialWidth * this._store.state.scale;
    this.height = this.initalHeight * this._store.state.scale;
    this.padding = 5;
    this.backgroundColor = 'red';
    this.scale = this._store.state.scale;
    this.value = 'Teststring to fix resizing';
  }

  override mount(element: HTMLTextAreaElement): void {
    if (this.isMounted) {
      return;
    }
    super.mount(element);

    requestAnimationFrame(() => {
      this.elementRef.focus();
      this.adjustTextareaSize();
    });
  }

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleFactor = height / this.height;

    this.fontSize = this.fontSize * scaleFactor;
    this.width = this.width * scaleFactor;
    this.height = height;
    this.translateX = x;
    this.translateY = y;
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
      this.height = this.elementRef.scrollHeight;

      this._store.rerender();
    }
  }
}
