import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
export class KritzelText extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelText';

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
  isEditing: boolean = false;

  editor: EditorView | null = null;

  readonly rows: number = 1;

  get isEmpty(): boolean {
    if (!this.editor) {
      return true;
    }

    const doc = this.editor.state.doc;
    
    // Check if document is empty (only has empty paragraph(s))
    // A truly empty doc has size of 4: start of doc (1) + paragraph (1) + end of paragraph (1) + end of doc (1)
    if (doc.content.size === 0) {
      return true;
    }

    // Check if all content is whitespace
    const text = doc.textContent.trim();
    return text.length === 0;
  }

  constructor(config?: {
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
    object.zIndex = core.store.currentZIndex;

    return object;
  }

  override mount(element: HTMLDivElement): void {
    if ((this.isMounted && this.elementRef === element) || this.isInViewport() === false) {
      return;
    }

    console.log('Mounting text object', this.id);

    this.elementRef = element;

    setTimeout(() => {
      // Create schema with basic formatting and list support
      const mySchema = new Schema({
        nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
        marks: schema.spec.marks,
      });

      // Create initial document with a paragraph containing placeholder text
      const doc = mySchema.node('doc', null, [mySchema.node('paragraph', null, [mySchema.text('Start typing...')])]);

      // Initialize ProseMirror editor without menu bar (disabled by default)
      this.editor = new EditorView(this.elementRef, {
        state: EditorState.create({
          doc: doc,
          plugins: [history(), keymap({ 'Mod-z': undo, 'Mod-y': redo }), keymap(baseKeymap)],
        }),
        editable: () => false, // Start disabled, enable in edit()
        dispatchTransaction: (transaction) => {
          const newState = this.editor.state.apply(transaction);
          this.editor.updateState(newState);
          
          // Adjust size after content changes
          this.adjustSizeOnInput();
        },
      });
    }, 0);

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
    if (this.editor) {
      const end = this.editor.state.doc.content.size;
      this.editor.dispatch(this.editor.state.tr.setSelection(TextSelection.create(this.editor.state.doc, end)));
      this.editor.focus();
    }
  }

  edit(): void {
    console.log('Editing text object', this.id);
    KritzelKeyboardHelper.disableInteractiveWidget();

    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('text'));
    this._core.store.state.activeText = this;
    this._core.clearSelection();

    // Enable the ProseMirror editor
    if (this.editor) {
      this.editor.setProps({ editable: () => true });
    }

    this.isEditing = true;

    this.focus();

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  save(): void {
    console.log('Saving text object', this.id);
    
    // Disable the ProseMirror editor
    if (this.editor) {
      this.editor.setProps({ editable: () => false });
      this.editor.dom.blur(); // Remove focus
    }

    this.isEditing = false;
    
    this._core.history.executeCommand(new UpdateObjectCommand(this._core, this, this, this));
  }

  handlePointerDown(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    event.stopPropagation();
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    event.stopPropagation();
  }

  handlePointerUp(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    event.stopPropagation();
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
