import { KritzelBaseObject } from './base-object.class';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelObjectCommonConfig } from '../../interfaces/object.interface';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../helpers/devices.helper';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { ThemeAwareColor } from '../../constants/color-palette.constants';
import { KritzelColorHelper } from '../../helpers/color.helper';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelFontRegistry } from '../registries/font-registry.class';

/**
 * Configuration options for creating a KritzelText instance.
 */
export interface KritzelTextConfig extends KritzelObjectCommonConfig {
  text?: string;
  translateX?: number;
  translateY?: number;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: ThemeAwareColor;
  height?: number;
  width?: number;
  scale?: number;
  rotation?: number;
  initialWidth?: number;
  initialHeight?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Represents a text object on the canvas that supports rich text editing via ProseMirror.
 * Extends the base object class to inherit common object properties and behaviors.
 */
export class KritzelText extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelText';

  fontFamily: string = 'Arial';
  fontSize: number = 8;
  fontColor: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };
  initialWidth: number = 1;
  initialHeight: number = 1;

  scale: number = 1;
  scaleFactor: number = 1;

  isDebugInfoVisible: boolean = true;
  isEditable: boolean = true;
  isEditing: boolean = false;
  isNewlyCreated: boolean = false;

  editor: EditorView | null = null;
  content: any = null;

  private readonly _schema: Schema = new Schema({
    nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
    marks: schema.spec.marks,
  });

  uneditedObject: KritzelText | null = null;

  readonly rows: number = 1;

  /**
   * Checks whether the text object contains any content.
   * @returns `true` if the editor is empty or contains only whitespace, `false` otherwise.
   */
  get isEmpty(): boolean {
    if (!this.editor) {
      return true;
    }

    const doc = this.editor!.state.doc;

    if (doc.content.size === 0) {
      return true;
    }

    const text = doc.textContent.trim();
    return text.length === 0;
  }

  /**
   * Constructs a new KritzelText instance with optional configuration.
   * Can be used by consumers to create text objects programmatically:
   * ```ts
   * const text = new KritzelText({ text: 'Hello World', translateX: 100, translateY: 100 });
   * await editor.addObject(text);
   * ```
   * @param config - Optional configuration object.
   * @param config.text - Initial plain text content.
   * @param config.translateX - Initial X translation position.
   * @param config.translateY - Initial Y translation position.
   * @param config.fontSize - Font size in points (default: 8).
   * @param config.fontFamily - Font family name (default: 'Arial').
   * @param config.fontColor - Theme-aware color object with light and dark values.
   * @param config.height - Initial height of the text element.
   * @param config.width - Initial width of the text element.
   * @param config.scale - Scale factor for the text object.
   * @param config.initialWidth - Initial width before scaling.
   * @param config.initialHeight - Initial height before scaling.
   * @param config.scaleX - Horizontal scale factor.
   * @param config.scaleY - Vertical scale factor.
   */
  constructor(config?: KritzelTextConfig) {
    super();
    ObjectHelper.applyCommonConfig(this, config);

    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);

    // Always create the editor so setContent() works immediately
    this.editor = this.createEditor();

    if (config) {
      this.translateX = config.translateX || 0;
      this.translateY = config.translateY || 0;
      this.fontSize = config.fontSize || 8;
      this.fontFamily = config.fontFamily || 'Arial';
      this.fontColor = config.fontColor || { light: '#000000', dark: '#ffffff' };

      // Guard _core access: scale may not be available when created by consumers
      const coreScale = this._core?.store?.state?.scale;
      const effectiveScale = coreScale != null && coreScale < 0 ? coreScale : 1;
      this.width = this.initialWidth / effectiveScale;
      this.height = (this.fontSize * 1.2) / effectiveScale;

      this.scale = config.scale || 1;
      this.scaleFactor = config.scaleX ?? 1;

      // Set initial text content if provided
      if (config.text) {
        this.setContent({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: config.text }],
            },
          ],
        });
      }
    }
  }

  /**
   * Factory method to create a new KritzelText instance with default settings.
   * Initializes the editor and registers the object with the core store.
   * @param core - The KritzelCore instance managing the canvas.
   * @param fontSize - Optional font size in points.
   * @param fontFamily - Optional font family name.
   * @param scale - Optional scale factor (defaults to current viewport scale).
   * @returns A new, fully initialized KritzelText instance.
   */
  static override create(core: KritzelCore, fontSize?: number, fontFamily?: string, scale?: number, rotation?: number): KritzelText {
    const object = new KritzelText();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.fontSize = fontSize || 8;
    object.fontFamily = fontFamily || 'Arial';
    object.translateX = 0;
    object.translateY = 0;
    object.rotation = KritzelMathHelper.degreesToRadians(rotation ?? 0);

    const coreScale = core.store.state.scale;
    const effectiveScale = coreScale < 0 ? coreScale : 1;
    object.width = object.initialWidth / effectiveScale;
    object.height = (object.fontSize * 1.2) / effectiveScale;

    object.backgroundColor = { light: 'transparent', dark: 'transparent' };
    object.initialWidth = object.width;
    object.initialHeight = object.height;
    object.scaleFactor = 1;
    object.scale = scale ?? coreScale;
    object.zIndex = core.store.currentZIndex;

    // Editor is already created in the constructor

    return object;
  }

  /**
   * Mounts the text object to a DOM element, attaching the ProseMirror editor.
   * Applies font styling and ensures the editor is properly rendered.
   * @param element - The HTML div element to mount the text object into.
   */
  override mount(element: HTMLDivElement): void {
    if (element === null || this.isInViewport() === false) {
      return;
    }

    element.style.fontFamily = KritzelFontRegistry.resolveCssFontFamily(this.fontFamily);
    element.style.fontSize = `${this.fontSize}pt`;
    element.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor, this._core?.themeManager?.currentTheme);

    if (this.isMounted && this.elementRef === element && this.editor!.dom.parentElement === element) {
      if (!this._core.store.state.isScaling && !this._core.store.state.isPanning) {
        requestAnimationFrame(() => this.adjustSizeOnInput());
      }
      return;
    }

    this.elementRef = element;
    this.elementRef.style.whiteSpace = 'pre-wrap';
    this.elementRef.style.wordWrap = 'break-word';
    this.elementRef.innerHTML = '';
    this.elementRef.appendChild(this.editor!.dom);

    this.isMounted = true;

    requestAnimationFrame(() => this.adjustSizeOnInput());
  }

  /**
   * Creates and configures a new ProseMirror EditorView instance.
   * Sets up the document schema, plugins, and transaction handling.
   * @returns A configured ProseMirror EditorView instance.
   */
  createEditor(): EditorView {
    const doc = this._schema.node('doc', null, [this._schema.node('paragraph')]);

    return new EditorView(null, {
      state: EditorState.create({
        doc: doc,
        plugins: [keymap(baseKeymap)],
      }),
      editable: () => false,
      dispatchTransaction: transaction => {
        const newState = this.editor!.state.apply(transaction);

        this.editor!.updateState(newState);

        if (transaction.docChanged) {
          this.content = newState.doc.toJSON();
          this.adjustSizeOnInput();

          if (!transaction.getMeta('fromRemote')) {
            this._core.store.objects.update(this, { temporary: true });
          }
        }
      },
    });
  }

  /**
   * Sets the content of the text editor from a serialized document structure.
   * Used to restore content from saved state or synchronize with remote changes.
   * @param content - The serialized ProseMirror document content in JSON format.
   */
  public setContent(content: any): void {
    this.content = content;

    if (this.editor! && content) {
      const newDoc = this.editor!.state.schema.nodeFromJSON(content);
      const tr = this.editor!.state.tr.replaceWith(0, this.editor!.state.doc.content.size, newDoc.content);

      tr.setMeta('fromRemote', true);
      this.editor!.dispatch(tr);
    }
  }

  /**
   * Dynamically adjusts the width and height of the text object based on content.
   * Recalculates dimensions when content changes and handles rotation offsets
   * to maintain proper positioning.
   */
  adjustSizeOnInput(): void {
    const element = this.elementRef;

    if (element && this.isMounted && element.scrollWidth > 0) {
      const previousTotalWidth = this.totalWidth;
      const previousTotalHeight = this.totalHeight;

      const newWidth = element.scrollWidth;
      const newHeight = element.scrollHeight;

      this.width = newWidth * this.scaleFactor;
      this.height = newHeight * this.scaleFactor;

      // Titlebars are sized from the object, so they need a render once the text has been measured.
      if (this._core?.objectTitlebarManager?.isEnabled && (this.totalWidth !== previousTotalWidth || this.totalHeight !== previousTotalHeight)) {
        this._core?.rerender();
      }

      if (this.rotation !== 0) {
        const newTotalWidth = this.totalWidth;
        const newTotalHeight = this.totalHeight;

        const deltaWidth = (newTotalWidth - previousTotalWidth) / 2 / this.scale;
        const deltaHeight = (newTotalHeight - previousTotalHeight) / 2 / this.scale;

        if (deltaWidth !== 0 || deltaHeight !== 0) {
          const cos = Math.cos(this.rotation);
          const sin = Math.sin(this.rotation);

          const rotatedDeltaX = cos * deltaWidth - sin * deltaHeight;
          const rotatedDeltaY = sin * deltaWidth + cos * deltaHeight;

          this.translateX += rotatedDeltaX - deltaWidth;
          this.translateY += rotatedDeltaY - deltaHeight;
        }
      }
    }
  }

  /**
   * Resizes the text object while maintaining aspect ratio through scale factor adjustment.
   * Updates position and dimensions, then persists changes to the store.
   * @param x - New X position (translateX value).
   * @param y - New Y position (translateY value).
   * @param width - Target width for the text object.
   * @param height - Target height for the text object.
   */
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

    this._core.store.objects.update(this);
  }

  /**
   * Focuses the text editor and optionally positions the cursor at specific coordinates.
   * Falls back to placing cursor at the end of the document if coordinates are invalid.
   * Handles iOS-specific scrolling behavior.
   * @param coords - Optional coordinates to position the cursor.
   * @param coords.x - X coordinate for cursor placement.
   * @param coords.y - Y coordinate for cursor placement.
   */
  focus(coords?: { x: number; y: number }): void {
    if (this.editor!) {
      const doc = this.editor!.state.doc;

      if (coords!.x && coords!.y && !this.isEmpty) {
        const pos = this.editor!.posAtCoords({ left: coords!.x, top: coords!.y });
        if (pos) {
          this.editor!.dispatch(this.editor!.state.tr.setSelection(TextSelection.create(doc, pos.pos)));
          this.editor!.focus();

          if (KritzelDevicesHelper.isIOS()) {
            this.scrollIntoViewOnIOS();
          }
          return;
        }
      }

      const end = Math.max(1, doc.content.size - 1);
      this.editor!.dispatch(this.editor!.state.tr.setSelection(TextSelection.create(doc, end)));
      this.editor!.focus();

      if (KritzelDevicesHelper.isIOS()) {
        this.scrollIntoViewOnIOS();
      }
    }
  }

  /**
   * Scrolls the editor into view on iOS devices after a short delay.
   * Addresses iOS-specific virtual keyboard and viewport issues.
   */
  private scrollIntoViewOnIOS(): void {
    setTimeout(() => {
      if (this.editor! && this.editor!.dom) {
        this.editor!.dom.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }, 300);
  }

  /**
   * Enters edit mode for the text object, enabling content editing.
   * Saves a snapshot of the current state, activates the text tool,
   * enables the editor, and focuses at the pointer position.
   * @param event - Optional pointer event containing cursor coordinates for focus placement.
   */
  edit(event?: PointerEvent): void {
    KritzelKeyboardHelper.disableInteractiveWidget();

    this.uneditedObject = this.clone() as KritzelText;

    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('text'));

    this.editor!.setProps({ editable: () => true });

    this.isEditing = true;

    this._core.rerender();

    this.adjustSizeOnInput();

    if (event?.clientX && event?.clientY) {
      this.focus({ x: event?.clientX, y: event?.clientY });
    }

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  /**
   * Exits edit mode and saves the current content.
   * Disables the editor, persists content to the document,
   * consolidates temporary history items, and emits change events.
   */
  save(): void {
    requestAnimationFrame(() => this.adjustSizeOnInput());

    this.content = this.editor!.state.doc.toJSON();

    this.editor!.setProps({ editable: () => false });

    this.editor!.dom.blur();

    this.isEditing = false;

    this._core.store.objects.consolidateTemporaryItems();

    this._core.store.objects.update(this);

    this._core.engine.emitObjectsChange();

    if (this.isNewlyCreated) {
      this.isNewlyCreated = false;
      this._core.engine.emitObjectsAdded([this]);
    } else {
      this._core.engine.emitObjectsUpdated([{ object: this, changedProperties: ['content'] }]);
    }
  }

  /**
   * Handles the Escape key while the text object is in edit mode.
   * Implements a two-stage behavior: if the editor currently has a non-empty
   * text selection, the selection is collapsed to a caret without exiting
   * edit mode. If the selection is already collapsed, edit mode is exited
   * (saving the current content or deleting the object if it is empty) and
   * the canvas selection is cleared so subsequent tool actions start fresh.
   */
  handleEscape(): void {
    if (!this.editor || !this.isEditing) {
      return;
    }

    const { state } = this.editor;

    if (!state.selection.empty) {
      const pos = state.selection.head;
      this.editor.dispatch(state.tr.setSelection(TextSelection.create(state.doc, pos)));
      this.editor.focus();
      return;
    }

    this._core.resetActiveText();
    this._core.clearSelection();
    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
  }

  /**
   * Handles pointer down events during text editing.
   * Stops event propagation to prevent canvas interaction while editing.
   * @param event - The pointer down event.
   */
  handlePointerDown(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    event.stopPropagation();
  }

  /**
   * Handles pointer move events during text editing.
   * Conditionally stops propagation based on whether the engine is tracking
   * the pointer, allowing proper event flow during text creation.
   * @param event - The pointer move event.
   */
  handlePointerMove(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    // Only stop propagation if the engine is not tracking this pointer.
    // During text creation, the engine adds the pointer before the text element
    // is in the DOM. We must let move events propagate so the engine can
    // update its pointer state.
    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  /**
   * Handles pointer up events during text editing.
   * Conditionally stops propagation to allow the engine to clean up pointer state,
   * preventing issues with stale pointers that could cause gesture misinterpretation.
   * @param event - The pointer up event.
   */
  handlePointerUp(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    // Only stop propagation if the engine is not tracking this pointer.
    // When a text is created during pointerdown, the engine adds the pointer
    // to its map before the text element exists in the DOM. By the time
    // pointerup fires, the text element may intercept the event (especially
    // on iOS where pointer capture may not redirect events in shadow DOM).
    // We must let the event propagate so the engine can clean up the pointer.
    // Without this, stale pointers accumulate and single-finger touches
    // get misinterpreted as two-finger zoom gestures.
    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  /**
   * Creates a deep copy of this text object, including a new editor instance.
   * Preserves all content from the original object.
   * @returns A new KritzelText instance with copied properties and content.
   */
  override copy(): KritzelText {
    const copiedObject = super.copy() as KritzelText;
    copiedObject.editor = copiedObject.createEditor();

    if (this.content) {
      copiedObject.setContent(this.content);
    }

    return copiedObject;
  }

  /**
   * Serializes the text object to a plain object for storage or transmission.
   * Excludes non-serializable properties like the core reference, editor instance,
   * and DOM elements.
   * @returns A plain object containing all serializable properties.
   */
  override serialize() {
    const { _core, _elementRef, _schema, element, totalWidth, totalHeight, editor, uneditedObject, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    return clonedProps;
  }

  /**
   * Restores a text object from a serialized representation.
   * Reconstructs the editor content from the saved document state.
   * @template KritzelText - The return type (for type inference).
   * @param object - The serialized object data to restore from.
   * @returns The deserialized text object instance.
   */
  override deserialize<KritzelText>(object: any): KritzelText {
    super.deserialize<KritzelText>(object);
    if (object.content) {
      this.setContent(object.content);
    }
    return this as unknown as KritzelText;
  }
}
