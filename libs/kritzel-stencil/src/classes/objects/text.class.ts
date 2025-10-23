import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import Quill, { Delta } from 'quill';
import { UpdateObjectCommand } from '../commands/update-object.command';
export class KritzelText extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelText';

  content: Delta = null;
  fontFamily: string = 'Arial';
  fontSize: number = 8;
  fontColor: string = '#000000';
  initialWidth: number = 1;
  initialHeight: number = 1;

  scale: number = 1;
  scaleFactor: number = 1;

  isNew: boolean = true;
  isDebugInfoVisible: boolean = true;
  isEditable: boolean = true;

  editor: Quill | null = null;

  readonly rows: number = 1;

  get isReadonly(): boolean {
    return !(this._core.store.state.activeTool instanceof KritzelTextTool);
  }

  get isEmpty(): boolean {
    return this.content === null || this.content.length() === 0 || (this.content.length() === 1 && this.content.ops?.[0]?.insert === ' ');
  }

  constructor(config?: {
    content: Delta;
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
      this.content = config.content || new Delta().insert(' ');
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.fontSize = config.fontSize || 8;
      this.fontFamily = config.fontFamily || 'Arial';
      this.fontColor = config.fontColor || '#000000';
      this.width = this.initialWidth / (this._core.store.state.scale < 0 ? this._core.store.state.scale : 1);
      this.height = (this.fontSize * 1.2) / (this._core.store.state.scale < 0 ? this._core.store.state.scale : 1);
      this.scale = config.scale || 1;
      this.scaleFactor = config.scaleX ?? 1;
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
    object.scaleFactor = 1;
    object.scale = object._core.store.state.scale;
    object.content = new Delta().insert(' ');
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  override mount(element: HTMLDivElement): void {
    if ((this.isMounted && this.elementRef === element) || this.isInViewport() === false) {
      return;
    }

    console.log('Mounting text object', this.id);

    this.elementRef = element;

    this.editor = new Quill(this.elementRef, {
      readOnly: true
    });

    this.editor.on('editor-change', () => {
      this.content = this.editor.getContents();
      this.adjustSizeOnInput();
    });

    this.isMounted = true;
  }

  adjustSizeOnInput(): void {
    const element = this.elementRef;

    if (element) {
      const newWidth = element.scrollWidth;
      const newHeight = element.scrollHeight;

      if (this.width !== newWidth || this.height !== newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        this._core.rerender();
      }
    }
  }

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const scaleX = width / this.initialWidth;
    const scaleY = height / this.initialHeight;

    this.scaleFactor = Math.min(scaleX, scaleY);

    this.width = this.width * this.scaleFactor;
    this.height = this.height * this.scaleFactor;

    this.translateX = x;
    this.translateY = y;
  }

  focus(): void {
    if (this.elementRef) {
      this.elementRef.focus();
    }
  }

  edit(): void {
    console.log('Editing text object', this.id);
    KritzelKeyboardHelper.disableInteractiveWidget();

    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('text'));
    this._core.store.state.activeText = this;
    this._core.clearSelection();

    this.editor.enable();

    this.focus();

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  save(): void {
    console.log('Saving text object', this.id);
    this._core.history.executeCommand(new UpdateObjectCommand(this._core, this, this, this));

    this.editor.disable();
    
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
