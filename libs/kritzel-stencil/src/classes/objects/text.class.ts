import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelTextTool } from '../tools/text-tool.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { $createParagraphNode, $createTextNode, $getRoot, createEditor, HISTORY_MERGE_TAG, LexicalEditor } from 'lexical';
import { $createHeadingNode, HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import { registerDragonSupport } from '@lexical/dragon';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';

function prepopulatedRichText() {
  const root = $getRoot();
  if (root.getFirstChild() !== null) {
    return;
  }

  const heading = $createHeadingNode('h1');
  heading.append($createTextNode('Hello World'));
  root.append(heading);

  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode('This is a demo environment built with Lexical'));
  root.append(paragraph);
}

export class KritzelText extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelText';

  value: string = '';
  fontFamily: string = 'Arial';
  fontSize: number = 8;
  fontColor: string = '#000000';
  initialWidth: number = 300;
  initialHeight: number = 400;

  scale: number = 1;
  scaleFactor: number = 1;

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
      this.width = this.initialWidth / (this._core.store.state.scale < 0 ? this._core.store.state.scale : 1);
      this.height = (this.fontSize * 1.2) / (this._core.store.state.scale < 0 ? this._core.store.state.scale : 1);
      this.scale = config.scale || 1;
      this.scaleFactor = config.scaleX ?? 1;
      this.editor = createEditor({
        namespace: 'Vanilla JS Demo',
        nodes: [HeadingNode, QuoteNode],
        onError: (error: Error) => {
          throw error;
        },
        theme: {
          quote: 'PlaygroundEditorTheme__quote',
        },
        editable: true,
      });
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
    object.value = ' ';
    object.zIndex = core.store.currentZIndex;
    object.editor = createEditor({
      namespace: 'Vanilla JS Demo',
      nodes: [HeadingNode, QuoteNode],
      onError: (error: Error) => {
        throw error;
      },
      theme: {
        quote: 'PlaygroundEditorTheme__quote',
      },
      editable: true,
    });

    return object;
  }

  override mount(element: HTMLDivElement): void {
    if ((this.isMounted && this.elementRef === element) || this.isInViewport() === false) {
      return;
    }

    this.elementRef = element;

    this.editor.setRootElement(this.elementRef);

    mergeRegister(registerRichText(this.editor), registerDragonSupport(this.editor), registerHistory(this.editor, createEmptyHistoryState(), 300));

    this.editor.registerUpdateListener(() => {
      console.log('Editor State Updated');
      this.initialHeight = this.elementRef.scrollHeight;
      this.initialWidth = this.elementRef.scrollWidth;
      this.width = this.initialWidth;
      this.height = this.initialHeight;
    });

    this.editor.update(prepopulatedRichText, { tag: HISTORY_MERGE_TAG });

    this.isMounted = true;
  }

  handleInput(): void {
    console.log('Input event detected');
    if (this.elementRef) {
      const newWidth = this.elementRef.scrollWidth;
      const newHeight = this.elementRef.scrollHeight;

      if (this.width !== newWidth || this.height !== newHeight) {
        this.initialWidth = newWidth;
        this.initialHeight = newHeight;
        this.width = newWidth;
        this.height = newHeight;
        // Rerender to apply the new dimensions
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

    // Use the smaller scale factor to maintain aspect ratio and fit within the new bounds
    this.scaleFactor = Math.min(scaleX, scaleY);

    // The width and height of the object are scaled versions of the initial dimensions
    this.width = this.initialWidth * this.scaleFactor;
    this.height = this.initialHeight * this.scaleFactor;

    this.translateX = x;
    this.translateY = y;
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (this.isReadonly) {
      event.preventDefault();
      event.stopPropagation();
    }
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
