import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { UpdateObjectCommand } from '../commands/update-object.command';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { AddObjectCommand } from '../commands/add-object.command';
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
  content: any = null;

  private readonly _schema: Schema = new Schema({
    nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
    marks: schema.spec.marks,
  });

  uneditedObject: KritzelText | null = null;

  readonly rows: number = 1;

  get isEmpty(): boolean {
    if (!this.editor) {
      return true;
    }

    const doc = this.editor.state.doc;

    if (doc.content.size === 0) {
      return true;
    }

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
    object.editor = object.createEditor();

    return object;
  }

  override mount(element: HTMLDivElement): void {
    if (element === null || this.isInViewport() === false) {
      return;
    }

    if (this.isMounted && this.elementRef === element && this.editor.dom.parentElement === element) {
      return;
    }

    this.elementRef = element;
    this.elementRef.style.fontFamily = this.fontFamily;
    this.elementRef.style.fontSize = `${this.fontSize}pt`;
    this.elementRef.style.color = this.fontColor;
    this.elementRef.style.whiteSpace = 'pre-wrap';
    this.elementRef.style.wordWrap = 'break-word';
    this.elementRef.innerHTML = '';
    this.elementRef.appendChild(this.editor.dom);

    this.isMounted = true;

    setTimeout(() => {
      this.adjustSizeOnInput();
      if (this._core) {
        this._core.store.state.objectsMap.update(this);
        this._core.rerender();
      }
    }, 0);
  }

  private createEditor(): EditorView {
    const doc = this._schema.node('doc', null, [this._schema.node('paragraph')]);

    return new EditorView(null, {
      state: EditorState.create({
        doc: doc,
        plugins: [keymap(baseKeymap)],
      }),
      editable: () => false,
      dispatchTransaction: transaction => {
        const newState = this.editor.state.apply(transaction);
        this.editor.updateState(newState);
        this.adjustSizeOnInput();
        this._core.store.state.objectsMap.update(this);
        this._core.rerender();
      },
    });
  }

  public setContent(content: any): void {
    this.content = content;

    if (this.editor) {
      const newDoc = this.editor.state.schema.nodeFromJSON(content);
      const tr = this.editor.state.tr.replaceWith(0, this.editor.state.doc.content.size, newDoc.content);
      this.editor.dispatch(tr);
    }
  }

  adjustSizeOnInput(): void {
    const element = this.elementRef;

    if (element && this.isMounted && element.scrollWidth > 0) {
      const newWidth = element.scrollWidth;
      const newHeight = element.scrollHeight;

      if (this.width !== newWidth * this.scaleFactor || this.height !== newHeight * this.scaleFactor) {
        this.width = newWidth * this.scaleFactor;
        this.height = newHeight * this.scaleFactor;
      }
    }
  }

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    const originalWidth = this.width / this.scaleFactor;
    const originalHeight = this.height / this.scaleFactor;

    const scaleX = width / originalWidth;
    const scaleY = height / originalHeight;

    this.scaleFactor = Math.min(scaleX, scaleY);

    this.width = originalWidth * this.scaleFactor;
    this.height = originalHeight * this.scaleFactor;

    this.translateX = x;
    this.translateY = y;
  }

  focus(): void {
    if (this.editor) {
      const doc = this.editor.state.doc;
      const end = Math.max(1, doc.content.size - 1);
      this.editor.dispatch(this.editor.state.tr.setSelection(TextSelection.create(doc, end)));
      this.editor.focus();
    }
  }

  edit(): void {
    KritzelKeyboardHelper.disableInteractiveWidget();

    this.uneditedObject = this.clone() as KritzelText;

    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('text'));
    this._core.store.state.activeText = this;

    if (this.editor) {
      this.editor.setProps({ editable: () => true });
    }

    this.isEditing = true;

    this.focus();

    this._core.rerender();

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  save(): void {
    this.content = this.editor.state.doc.toJSON();
    this.editor.setProps({ editable: () => false });
    this.editor.dom.blur();


    this.isEditing = false;

    if (this.isNew) {
      this.isNew = false;
      this._core.commandManager.executeCommand(new AddObjectCommand<KritzelText>(this._core, this, this));
    } else {
      this._core.commandManager.executeCommand(new UpdateObjectCommand<KritzelText>(this._core, this, this.uneditedObject, { ...this }));
    }
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
    const { _core, _elementRef, _schema, element, totalWidth, totalHeight, editor, uneditedObject, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    return clonedProps;
  }

  override deserialize<KritzelText>(object: any): KritzelText {
    super.deserialize<KritzelText>(object);
    this.setContent(object.content);
    return this as unknown as KritzelText;
  }

  override onExecuteUpdateCommand(updatedProperties: Partial<KritzelText>): void {
    if ('content' in updatedProperties) {
      this.setContent(updatedProperties.content);
    }
  }

  override onUndoUpdateCommand(previousProperties: Partial<KritzelText>): void {
    if ('content' in previousProperties && this.editor) {
      this.setContent(previousProperties.content);
    }
  }
}
