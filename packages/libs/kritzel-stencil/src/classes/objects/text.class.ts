import { KritzelStore } from '../store.class';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelText extends KritzelBaseObject<HTMLTextAreaElement> {
  value: string = '';

  fontFamily: string = 'Arial';

  fontSize: number = 8;

  fontColor: string = '#000000';

  initialWidth: number = 3;

  isNew: boolean = true;

  override debugInfoVisible: boolean = true;

  readonly rows: number = 1;

  get isReadonly(): boolean {
    return !(this._store.state.activeTool instanceof KritzelTextTool);
  }

  constructor(store: KritzelStore, fontSize: number, fontFamily: string) {
    super(store);
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
    this.translateX = 0;
    this.translateY = 0;
    this.width = this.initialWidth / (this._store.state.scale < 0 ? this._store.state.scale : 1);
    this.height = (this.fontSize * 1.2) / (this._store.state.scale < 0 ? this._store.state.scale : 1);
    this.padding = 5;
    this.backgroundColor = 'transparent';
    this.scale = this._store.state.scale;
    this.value = ' ';
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
    if (target.value === '') {
      this.value = ' ';
      target.value = ' ';
      target.selectionStart = target.selectionEnd = target.value.length;
    } else {
      this.value = target.value.trim();
    }

    this.adjustTextareaSize();
  }

  adjustTextareaSize() {
    if (this.elementRef) {
      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.whiteSpace = 'pre-wrap'; 
      span.style.visibility = 'hidden';
      span.style.fontSize = window.getComputedStyle(this.elementRef).fontSize;
      span.style.fontFamily = window.getComputedStyle(this.elementRef).fontFamily;

      span.innerHTML = this.elementRef.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>') + '<br>';

      document.body.appendChild(span);
      const textWidth = span.offsetWidth;
      const textHeight = span.offsetHeight;
      document.body.removeChild(span);

      this.width = textWidth;
      this.height = textHeight;

      this._store.rerender();
    }
  }

  focus(): void {
    if (this.elementRef) {
      this.elementRef.focus();
    }
  }

  selectAll(): void {
    if (this.elementRef) {
      this.elementRef.select();
    }
  }

  insertFromClipboard(): void {
    if (this.elementRef) {
      this.elementRef.focus();
      try {
        navigator.clipboard.readText().then(text => {
          const start = this.elementRef.selectionStart;
          const end = this.elementRef.selectionEnd;
          const value = this.elementRef.value;

          this.elementRef.value = value.substring(0, start) + text + value.substring(end);

          this.elementRef.selectionStart = this.elementRef.selectionEnd = start + text.length;
          this.value = this.elementRef.value;
          this.adjustTextareaSize();
        });
      } catch (err) {
        console.error('Failed to read clipboard contents:', err);
      }
    }
  }
}
