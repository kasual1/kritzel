import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, LexicalEditor } from 'lexical';

export class KritzelText extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelText';

  value: string = '';
  fontFamily: string = 'Arial';
  fontSize: number = 8;
  fontColor: string = '#000000';
  initialWidth: number = 100;
  initialHeight: number = 1;

  scale: number = 1;
  scaleX: number = 1;
  scaleY: number = 1;

  isNew: boolean = true;
  isDebugInfoVisible: boolean = true;
  isEditable: boolean = true;

  editor: LexicalEditor | null = null;

  readonly rows: number = 1;

  get isReadonly(): boolean {
    return !(this._core.store.state.activeTool instanceof KritzelTextTool);
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
    initialWidth?: number;
    initialHeight?: number;
    scaleX?: number;
    scaleY?: number;
  }) {
    super();

    if (config) {
      this.value = config.value || ' ';
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.fontSize = config.fontSize || 8;
      this.fontFamily = config.fontFamily || 'Arial';
      this.fontColor = config.fontColor || '#000000';
      this.height = config.height ?? this.fontSize * 1.2;
      this.width = config.width ?? this.initialWidth;
      this.scale = config.scale || 1;
      this.initialWidth = config.initialWidth ?? (this.width > 0 ? this.width : this.initialWidth);
      this.initialHeight = config.initialHeight ?? (this.height > 0 ? this.height : this.initialHeight);
      this.scaleX = config.scaleX ?? (this.initialWidth > 0 ? this.width / this.initialWidth : 1);
      this.scaleY = config.scaleY ?? (this.initialHeight > 0 ? this.height / this.initialHeight : 1);
      this.editor = createEditor();
    }
  }

  static override create(core: KritzelCore, fontSize?: number, fontFamily?: string): KritzelText {
    const object = new KritzelText();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.fontSize = fontSize;
    object.fontFamily = fontFamily;
    object.translateX = 0;
    object.translateY = 0;
    object.width = object.initialWidth / (object._core.store.state.scale < 0 ? object._core.store.state.scale : 1);
    object.height = (object.fontSize * 1.2) / (object._core.store.state.scale < 0 ? object._core.store.state.scale : 1);
    object.backgroundColor = 'transparent';
    object.initialWidth = object.width;
    object.initialHeight = object.height;
    object.scaleX = 1;
    object.scaleY = 1;
    object.scale = object._core.store.state.scale;
    object.value = ' ';
    object.zIndex = core.store.currentZIndex;
    object.editor = createEditor();

    return object;
  }

  get baseWidth(): number {
    if (this.initialWidth > 0) {
      return this.initialWidth;
    }

    if (this.scaleX !== 0 && this.width > 0) {
      return this.width / this.scaleX;
    }

    return this.width > 0 ? this.width : 1;
  }

  get baseHeight(): number {
    if (this.initialHeight > 0) {
      return this.initialHeight;
    }

    if (this.scaleY !== 0 && this.height > 0) {
      return this.height / this.scaleY;
    }

    return this.height > 0 ? this.height : 1;
  }

  override mount(element: HTMLDivElement): void {
    if ((this.isMounted && this.elementRef === element) || this.isInViewport() === false) {
      return;
    }

    this.elementRef = element;
    this.editor.setRootElement(this.elementRef);
    this.isMounted = true;

    this.applyEditorStyles();

    this.editor.update(() => {
      const root = $getRoot();
      const paragraphNode = $createParagraphNode();
      const textNode = $createTextNode('Hello world');
      paragraphNode.append(textNode);
      root.append(paragraphNode);
    });

    this.editor.setEditable(false);
  }

  private applyEditorStyles(): void {
    if (!this.elementRef) {
      return;
    }

    this.elementRef.style.transformOrigin = 'top left';
    this.elementRef.style.transform = `scale(${this.scaleX}, ${this.scaleY})`;
    this.elementRef.style.width = `${this.baseWidth}px`;
    this.elementRef.style.height = `${this.baseHeight}px`;
  }

  

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    if (this.initialWidth <= 0) {
      this.initialWidth = this.width > 0 ? this.width : width;
    }

    if (this.initialHeight <= 0) {
      this.initialHeight = this.height > 0 ? this.height : height;
    }

    this.scaleX = width / this.initialWidth;
    this.scaleY = height / this.initialHeight;

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    this.applyEditorStyles();
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

    this.updateTextareaDimensions();
  }

  updateTextareaDimensions() {
    // if (this.elementRef) {
    //   const span = document.createElement('span');
    //   span.style.position = 'absolute';
    //   span.style.whiteSpace = 'pre-wrap';
    //   span.style.visibility = 'hidden';
    //   span.style.fontSize = window.getComputedStyle(this.elementRef).fontSize;
    //   span.style.fontFamily = window.getComputedStyle(this.elementRef).fontFamily;
    //   span.innerHTML = this.elementRef.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') + '<br>';
    //   document.body.appendChild(span);
    //   const textWidth = span.offsetWidth;
    //   const textHeight = span.offsetHeight;
    //   document.body.removeChild(span);
    //   this.width = textWidth;
    //   this.height = textHeight;
    //   this._core.history.executeCommand(new UpdateObjectCommand(this._core, this, this, { ...this }));
    // }
  }

  focus(): void {
    if (this.elementRef) {
      this.elementRef.focus();
    }
  }

  selectAll(): void {
    // if (this.elementRef) {
    //   this.elementRef.select();
    // }
  }

  insertFromClipboard(): void {
    // if (this.elementRef) {
    //   this.elementRef.focus();
    //   try {
    //     navigator.clipboard.readText().then(text => {
    //       const start = this.elementRef.selectionStart;
    //       const end = this.elementRef.selectionEnd;
    //       const value = this.elementRef.value;
    //       this.value = (value.substring(0, start) + text + value.substring(end)).trim();
    //       this.elementRef.value = this.value;
    //       const length = this.elementRef.value.length;
    //       this.elementRef.setSelectionRange(length, length);
    //       this.updateTextareaDimensions();
    //     });
    //   } catch (err) {
    //     console.error('Failed to read clipboard contents:', err);
    //   }
    // }
  }

  edit(): void {
    KritzelKeyboardHelper.disableInteractiveWidget();

    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('text'));
    this._core.store.state.activeText = this;
    this._core.clearSelection();

    this.focus();

    KritzelKeyboardHelper.enableInteractiveWidget();
  }
  
  override serialize() {
    const { _core, _elementRef, element, totalWidth, totalHeight, editor, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    return clonedProps;
  }
}
