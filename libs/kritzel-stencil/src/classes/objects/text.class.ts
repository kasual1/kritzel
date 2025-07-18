import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelStore } from '../store.class';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseObject } from './base-object.class';

export class KritzelText extends KritzelBaseObject<HTMLTextAreaElement> {
  override __class__: string = 'KritzelText';

  value: string = '';

  fontFamily: string = 'Arial';

  fontSize: number = 8;

  fontColor: string = '#000000';

  initialWidth: number = 3;

  isNew: boolean = true;

  override debugInfoVisible: boolean = true;

  override isEditable: boolean = true;

  readonly rows: number = 1;

  get isReadonly(): boolean {
    return !(this._store.state.activeTool instanceof KritzelTextTool);
  }

  constructor(config?: {
    value: string;
    translateX?: number;
    translateY?: number;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: string;
    height?: number;
    width?: number;
    scale?: number;
  }) {
    super();

    if (config) {
      this.value = config.value || ' ';
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.fontSize = config.fontSize || 8;
      this.fontFamily = config.fontFamily || 'Arial';
      this.fontColor = config.fontColor || '#000000';
      this.height = config.height || this.fontSize * 1.2;
      this.width = config.width || 0;
      this.scale = config.scale || 1;
    }
  }

  static override create(store: KritzelStore, fontSize?: number, fontFamily?: string): KritzelText {
    const object = new KritzelText();

    object._store = store;
    object.fontSize = fontSize;
    object.fontFamily = fontFamily;
    object.translateX = 0;
    object.translateY = 0;
    object.width = object.initialWidth / (object._store.state.scale < 0 ? object._store.state.scale : 1);
    object.height = (object.fontSize * 1.2) / (object._store.state.scale < 0 ? object._store.state.scale : 1);
    object.padding = 5;
    object.backgroundColor = 'transparent';
    object.scale = object._store.state.scale;
    object.value = ' ';
    object.zIndex = store.currentZIndex;

    return object;
  }

  override mount(element: HTMLTextAreaElement): void {
    if ((this.isMounted && this.elementRef === element) || this.isInViewport() === false) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
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

  handleKeyDown(event: KeyboardEvent): void {
    if (this.isReadonly) {
      event.preventDefault();
      event.stopPropagation();
    }
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

      span.innerHTML = this.elementRef.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '<br>';

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

  edit(): void {
    this._store.setState('activeTool', KritzelToolRegistry.getTool('text'));
    this._store.state.selectionGroup = null;
    this._store.state.selectionBox = null;
    this._store.state.activeText = this;

    setTimeout(() => {
      this.focus();
    }, 300);
  }
}
