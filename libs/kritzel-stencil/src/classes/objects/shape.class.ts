import { KritzelBaseObject } from './base-object.class';
import { KritzelCore } from '../core/core.class';
import { KritzelKeyboardHelper } from '../../helpers/keyboard.helper';
import { KritzelDevicesHelper } from '../../helpers/devices.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { ShapeType } from '../../enums/shape-type.enum';
import { KritzelPoint } from '../../interfaces/point.interface';
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
import { KritzelObjectExportContext, KritzelObjectExportFormat } from '../../interfaces/object-export.interface';

export class KritzelShape extends KritzelBaseObject<HTMLDivElement> {
  override __class__: string = 'KritzelShape';

  shapeType: ShapeType = ShapeType.Rectangle;
  fillColor: ThemeAwareColor = { light: 'transparent', dark: 'transparent' };
  strokeColor: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };
  strokeWidth: number = 4;

  fontFamily: string = 'Arial';
  fontSize: number = 16;
  fontColor: ThemeAwareColor = { light: '#000000', dark: '#ffffff' };

  /** Screen-space x coordinate of the shape's top-left corner (like Path.x) */
  x: number = 0;
  /** Screen-space y coordinate of the shape's top-left corner (like Path.y) */
  y: number = 0;

  scale?: number = 1;
  scaleFactor: number = 1;

  isDebugInfoVisible: boolean = true;
  isEditable: boolean = true;
  isEditing: boolean = false;

  editor: EditorView | null = null;
  content: any = null;

  private readonly _schema: Schema = new Schema({
    nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
    marks: schema.spec.marks,
  });

  uneditedObject: KritzelShape | null = null;

  /**
   * Returns the viewBox for the shape's SVG, using screen-space coordinates.
   * This follows the same pattern as KritzelPath.viewBox.
   */
  get viewBox(): string {
    return `${this.x} ${this.y} ${this.width} ${this.height}`;
  }

  /**
   * Creates a new KritzelShape instance with optional configuration.
   * This constructor initializes the shape with default values that can be
   * overridden by the provided configuration object.
   *
   * @param config - Optional configuration object for the shape
   * @param config.x - Screen-space x coordinate of the shape's top-left corner
   * @param config.y - Screen-space y coordinate of the shape's top-left corner
   * @param config.translateX - World-space x translation offset
   * @param config.translateY - World-space y translation offset
   * @param config.width - Width of the shape in screen-space pixels
   * @param config.height - Height of the shape in screen-space pixels
   * @param config.shapeType - Type of shape (Rectangle, Ellipse, Triangle)
   * @param config.fillColor - Theme-aware fill color with light and dark variants
   * @param config.strokeColor - Theme-aware stroke color with light and dark variants
   * @param config.strokeWidth - Width of the shape's stroke in pixels
   * @param config.fontSize - Font size for text content in points
   * @param config.fontFamily - Font family for text content
   * @param config.fontColor - Theme-aware font color (auto-determined from fillColor if not specified)
   * @param config.scale - Viewport scale factor at creation time
   * @param config.scaleX - Horizontal scale factor for transformations
   * @param config.scaleY - Vertical scale factor for transformations
   */
  constructor(config?: {
    x?: number;
    y?: number;
    translateX?: number;
    translateY?: number;
    rotation?: number;
    width?: number;
    height?: number;
    shapeType?: ShapeType;
    fillColor?: ThemeAwareColor;
    strokeColor?: ThemeAwareColor;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontColor?: ThemeAwareColor;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
  }) {
    super();

    // Always create the editor so setContent() works immediately
    this.editor = this.createEditor();

    if (config) {
      this.x = config.x ?? 0;
      this.y = config.y ?? 0;
      this.translateX = config.translateX ?? 0;
      this.translateY = config.translateY ?? 0;
      this.rotation = KritzelMathHelper.degreesToRadians(config.rotation ?? 0);
      this.width = config.width ?? 100;
      this.height = config.height ?? 100;
      this.shapeType = config.shapeType ?? ShapeType.Rectangle;
      this.fillColor = config.fillColor ?? { light: 'transparent', dark: 'transparent' };
      this.strokeColor = config.strokeColor ?? config.fillColor ?? { light: '#000000', dark: '#ffffff' };
      this.strokeWidth = config.strokeWidth ?? 4;
      this.fontSize = config.fontSize ?? 16;
      this.fontFamily = config.fontFamily ?? 'Arial';
      this.fontColor = config.fontColor ?? KritzelColorHelper.determineTextColor(this.fillColor);
      this.scale = config.scale;
      this.scaleFactor = config.scaleX ?? 1;
    }
  }

  /**
   * Creates a new KritzelShape with screen-space coordinates.
   * Following the same pattern as KritzelPath.create():
   * - x, y are screen-space coordinates of the shape's top-left corner
   * - translateX, translateY should be set to -viewportTranslateX, -viewportTranslateY
   * - width, height are in screen-space
   * - scale is the viewport scale at creation time
   */
  static override create(
    core: KritzelCore,
    config?: {
      x?: number;
      y?: number;
      translateX?: number;
      translateY?: number;
      rotation?: number;
      width?: number;
      height?: number;
      shapeType?: ShapeType;
      fillColor?: ThemeAwareColor;
      strokeColor?: ThemeAwareColor;
      strokeWidth?: number;
      opacity?: number;
      fontSize?: number;
      fontFamily?: string;
      fontColor?: ThemeAwareColor;
      scale?: number;
    }
  ): KritzelShape {
    const object = new KritzelShape();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.x = config?.x ?? 0;
    object.y = config?.y ?? 0;
    object.translateX = config?.translateX ?? 0;
    object.translateY = config?.translateY ?? 0;
    object.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    object.width = config?.width ?? 100;
    object.height = config?.height ?? 100;
    object.shapeType = config?.shapeType ?? ShapeType.Rectangle;
    object.fillColor = config?.fillColor ?? { light: 'transparent', dark: 'transparent' };
    object.strokeColor = config?.strokeColor ?? config?.fillColor ?? { light: '#000000', dark: '#ffffff' };
    object.strokeWidth = config?.strokeWidth ?? 4;
    object.opacity = config?.opacity ?? 1;
    object.fontSize = config?.fontSize ?? 16;
    object.fontFamily = config?.fontFamily ?? 'Arial';
    object.fontColor = config?.fontColor ?? KritzelColorHelper.determineTextColor(object.fillColor);
    object.backgroundColor = { light: 'transparent', dark: 'transparent' };
    object.scaleFactor = 1;
    object.scale = config?.scale ?? core.store.state.scale;
    object.zIndex = core.store.currentZIndex;

    // Compute world-space translateX/Y from screen-space coordinates
    // This follows the same pattern as KritzelPath.updateDimensions()
    object.updateDimensions();

    return object;
  }

  /**
   * Updates the translateX/Y to world coordinates based on screen-space x, y.
   * This follows the same pattern as KritzelPath.updateDimensions().
   * 
   * The formula: translateX = (x + initialTranslateX) / scale
   * where initialTranslateX was -viewportTranslateX
   * 
   * This converts screen-space position to world coordinates.
   */
  updateDimensions(): void {
    this.translateX = (this.x + this.translateX) / this.scale;
    this.translateY = (this.y + this.translateY) / this.scale;
  }

  /**
   * Mounts the shape to a DOM element for rendering.
   * This method attaches the shape to the provided HTML element, enabling
   * it to be displayed in the viewport. It performs visibility checks and
   * prevents redundant mounting operations.
   *
   * @param element - The HTML div element to mount the shape to
   * @returns void
   */
  override mount(element: HTMLDivElement): void {
    if (element === null || this.isInViewport() === false) {
      return;
    }

    if (this.isMounted && this.elementRef === element && this.editor!!.dom.parentElement === element) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
  }

  /**
   * Mounts the ProseMirror text editor to a DOM element.
   * This method attaches the rich text editor to the provided container element,
   * applying font styling and ensuring proper text wrapping. It prevents
   * redundant DOM operations if the editor is already mounted to the same element.
   *
   * @param element - The HTML div element to mount the text editor to
   * @returns void
   */
  mountTextEditor(element: HTMLDivElement): void {
    if (element === null) {
      return;
    }

    element.style.fontFamily = this.fontFamily;
    element.style.fontSize = `${this.fontSize}pt`;
    element.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor, this._core?.themeManager?.currentTheme);
    element.style.whiteSpace = 'pre-wrap';
    element.style.wordWrap = 'break-word';

    if (this.editor!.dom.parentElement === element) {
      return;
    }

    element.innerHTML = '';
    element.appendChild(this.editor!.dom);
  }

  /**
   * Creates and initializes a ProseMirror editor instance for rich text editing.
   * The editor is configured with a schema that supports basic text formatting
   * and list nodes. It starts in non-editable mode and handles document changes
   * by updating the shape's content and syncing with the store.
   *
   * @returns A new ProseMirror EditorView instance configured for this shape
   */
  private createEditor(): EditorView {
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

          if (!transaction.getMeta('fromRemote')) {
            this._core.store.objects.update(this, { temporary: true });
          }
        }
      },
    });
  }

  /**
   * Sets the text content of the shape's editor from a serialized document.
   * This method is typically used to restore content from storage or to apply
   * remote changes during collaboration. The 'fromRemote' meta flag prevents
   * the change from being re-broadcast to collaborators.
   *
   * @param content - The serialized ProseMirror document content (JSON format)
   * @returns void
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
   * Resizes the shape to the specified dimensions and position.
   * This method updates the shape's world-space coordinates and dimensions,
   * then triggers a store update to persist the changes. Minimum dimension
   * constraints prevent the shape from becoming invisibly small.
   *
   * @param x - New world-space x coordinate for the shape's position
   * @param y - New world-space y coordinate for the shape's position
   * @param width - New width of the shape in pixels
   * @param height - New height of the shape in pixels
   * @returns void
   */
  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    this._core.store.objects.update(this);
  }

  /**
   * Focuses the text editor and optionally positions the cursor at specific coordinates.
   * If coordinates are provided, the cursor is placed at the corresponding text position.
   * Otherwise, the cursor is placed at the end of the document. On iOS devices,
   * additional scrolling behavior is triggered to ensure visibility.
   *
   * @param coords - Optional screen coordinates to position the cursor
   * @param coords.x - Screen x coordinate for cursor placement
   * @param coords.y - Screen y coordinate for cursor placement
   * @returns void
   */
  focus(coords?: { x: number; y: number }): void {
    if (!this.editor) {
      return;
    }

    const doc = this.editor.state.doc;

    if (coords && Number.isFinite(coords.x) && Number.isFinite(coords.y)) {
      const pos = this.editor!.posAtCoords({ left: coords.x, top: coords.y });
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

  /**
   * Scrolls the editor into view on iOS devices with a slight delay.
   * This workaround addresses iOS-specific behavior where the virtual keyboard
   * can obscure the editor. The delay allows the keyboard to fully appear
   * before scrolling.
   *
   * @returns void
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
   * Enters edit mode for the shape, enabling text editing.
   * This method stores a clone of the current state for potential undo operations,
   * switches to the shape tool, enables the editor, and focuses at the pointer
   * location if provided. Keyboard handling is temporarily adjusted to support
   * text input.
   *
   * @param event - Optional pointer event containing the click coordinates for cursor placement
   * @returns void
   */
  edit(event?: PointerEvent): void {
    KritzelKeyboardHelper.disableInteractiveWidget();

    this.uneditedObject = this.clone() as KritzelShape;
    const hasPointerCoordinates = typeof event?.clientX === 'number' && typeof event?.clientY === 'number';
    const focusCoordinates = hasPointerCoordinates ? { x: event!.clientX, y: event!.clientY } : undefined;

    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('shape'));

    this.editor!.setProps({ editable: () => true });

    this.isEditing = true;

    this._core.rerender();

    if (focusCoordinates) {
      this.focus(focusCoordinates);
    }

    // iOS can drop initial focus when edit mode toggles and the DOM re-renders.
    // Retry focus in the next frame while still in the same interaction sequence.
    if (KritzelDevicesHelper.isIOS() && focusCoordinates) {
      requestAnimationFrame(() => {
        if (this.isEditing) {
          this.focus(focusCoordinates);
        }
      });
    }

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  /**
   * Exits edit mode and saves the current text content.
   * This method serializes the editor's document state, disables editing,
   * removes focus from the editor, consolidates any temporary changes in the
   * store, and emits an objects change event to notify listeners.
   *
   * @returns void
   */
  save(): void {
    this.content = this.editor!.state.doc.toJSON();

    this.editor!.setProps({ editable: () => false });

    this.editor!.dom.blur();

    this.isEditing = false;

    this._core.store.objects.consolidateTemporaryItems();

    this._core.store.objects.update(this);

    this._core.engine.emitObjectsChange();
  }

  /**
   * Handles the Escape key while the shape's text editor is in edit mode.
   * Implements a two-stage behavior: if the editor currently has a non-empty
   * text selection, the selection is collapsed to a caret without exiting
   * edit mode. If the selection is already collapsed, edit mode is exited
   * (saving the current content), the canvas selection is cleared and the
   * active tool is switched back to the selection tool so subsequent
   * interactions start fresh.
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

    this._core.resetActiveShape();
    this._core.clearSelection();
    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
  }

  /**
   * Handles pointer down events when the shape is in edit mode.
   * This method stops event propagation for untracked pointers to prevent
   * the canvas from capturing text selection interactions within the editor.
   *
   * @param event - The pointer down event from user interaction
   * @returns void
   */
  handlePointerDown(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  /**
   * Handles pointer move events when the shape is in edit mode.
   * This method stops event propagation for untracked pointers to allow
   * text selection drag operations within the editor without triggering
   * canvas pan or other interactions.
   *
   * @param event - The pointer move event from user interaction
   * @returns void
   */
  handlePointerMove(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  /**
   * Handles pointer up events when the shape is in edit mode.
   * This method stops event propagation for untracked pointers to complete
   * text selection operations within the editor without triggering
   * canvas click handlers.
   *
   * @param event - The pointer up event from user interaction
   * @returns void
   */
  handlePointerUp(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  /**
   * Creates a copy of this shape with a new editor instance.
   * This method extends the base copy behavior by creating a fresh
   * ProseMirror editor for the copied shape and restoring the text
   * content from the original.
   *
   * @returns A new KritzelShape instance with copied properties and content
   */
  override copy(): KritzelShape {
    const copiedObject = super.copy() as KritzelShape;
    copiedObject.editor = copiedObject.createEditor();

    if (this.content) {
      copiedObject.setContent(this.content);
    }

    return copiedObject;
  }

  /**
   * Serializes the shape to a plain JavaScript object for storage or transmission.
   * This method excludes non-serializable properties like the core reference,
   * DOM elements, schema, and editor instance. The remaining properties are
   * deep-cloned to prevent reference issues.
   *
   * @returns A serializable object containing all persistent shape properties
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
   * Restores a shape from a serialized object representation.
   * This method extends the base deserialization by additionally restoring
   * the text editor content from the serialized data.
   *
   * @template KritzelShape - The type parameter for return type consistency
   * @param object - The serialized shape data to restore from
   * @returns The deserialized shape instance (this)
   */
  override deserialize<KritzelShape>(object: any): KritzelShape {
    super.deserialize<KritzelShape>(object);
    if (object.content) {
      this.setContent(object.content);
    }
    return this as unknown as KritzelShape;
  }

  /**
   * Lifecycle hook called after properties are updated via updateObject.
   * This method automatically adjusts the text color based on fill color
   * brightness to ensure readability. When the fill color changes, the font
   * color is recalculated and the editor's styling is updated immediately.
   *
   * @param changedProperties - Array of property names that were modified
   * @returns void
   */
  override onAfterUpdate(changedProperties: string[]): void {
    if (changedProperties.includes('fillColor')) {
      this.fontColor = KritzelColorHelper.determineTextColor(this.fillColor);
      // Update the editor's text color immediately
      if (this.editor!?.dom?.parentElement) {
        this.editor!.dom.parentElement.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor, this._core?.themeManager?.currentTheme);
      }
    } else if (changedProperties.includes('fontColor')) {
      // Also update editor when fontColor changes directly
      if (this.editor!?.dom?.parentElement) {
        this.editor!.dom.parentElement.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor, this._core?.themeManager?.currentTheme);
      }
    }
  }

  /**
   * Returns the clipping polygon for arrow intersection calculations.
   * This method generates a polygon representation of the shape's outline
   * for use in determining where arrows or connectors should terminate.
   * 
   * The polygon includes padding for half the stroke width to ensure
   * arrow heads don't visually overlap the shape's stroke.
   *
   * Shape-specific behavior:
   * - Ellipse: Returns a 32-segment polygon approximation of the ellipse
   * - Triangle: Returns the 3 corner points, expanded outward by stroke padding
   * - Rectangle: Returns null to use the default rotatedPolygon from base class
   *
   * @returns An array of KritzelPoint objects defining the clipping polygon,
   *          or null for rectangles (which use the default implementation)
   */
  getClipPolygon(): KritzelPoint[] | null {
    // Calculate world-space center and dimensions
    const worldWidth = this.totalWidth / this.scale;
    const worldHeight = this.totalHeight / this.scale;
    const centerX = this.translateX + worldWidth / 2;
    const centerY = this.translateY + worldHeight / 2;

    // Add padding for stroke width so arrows don't overlap the stroke
    const strokePadding = (this.strokeWidth / this.scale) / 2;

    switch (this.shapeType) {
      case ShapeType.Ellipse:
        // Return a 32-segment polygon approximation of the ellipse
        // Add stroke padding to radii
        return KritzelGeometryHelper.getEllipsePolygonApproximation(
          centerX,
          centerY,
          worldWidth / 2 + strokePadding,
          worldHeight / 2 + strokePadding,
          32,
          this.rotation
        );

      case ShapeType.Triangle:
        // Return the 3 corners of the triangle in world coordinates
        // Triangle: top-center, bottom-right, bottom-left
        // Expand each vertex outward from center by strokePadding
        const expandVertex = (vx: number, vy: number) => {
          const dx = vx - centerX;
          const dy = vy - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return { x: vx, y: vy };
          const scale = (dist + strokePadding) / dist;
          return {
            x: centerX + dx * scale,
            y: centerY + dy * scale
          };
        };

        const topX = this.translateX + worldWidth / 2;
        const topY = this.translateY;
        const bottomLeftX = this.translateX;
        const bottomLeftY = this.translateY + worldHeight;
        const bottomRightX = this.translateX + worldWidth;
        const bottomRightY = this.translateY + worldHeight;

        const expandedTop = expandVertex(topX, topY);
        const expandedBottomRight = expandVertex(bottomRightX, bottomRightY);
        const expandedBottomLeft = expandVertex(bottomLeftX, bottomLeftY);

        // Apply rotation around center if rotated
        if (this.rotation !== 0) {
          const cos = Math.cos(this.rotation);
          const sin = Math.sin(this.rotation);
          const rotate = (p: KritzelPoint) => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            return {
              x: centerX + dx * cos - dy * sin,
              y: centerY + dx * sin + dy * cos
            };
          };
          return [
            rotate(expandedTop),
            rotate(expandedBottomRight),
            rotate(expandedBottomLeft)
          ];
        }

        return [expandedTop, expandedBottomRight, expandedBottomLeft];

      case ShapeType.Rectangle:
      default:
        // For rectangles, return null to use the default rotatedPolygon
        return null;
    }
  }

  /**
   * Generates the SVG path string for rendering the shape.
   * The path uses screen-space coordinates relative to the shape's (x, y) position.
   * This method supports all shape types and returns the appropriate path commands.
   *
   * Path formats by shape type:
   * - Rectangle: Four-point closed path (M, L, L, L, Z)
   * - Ellipse: Two-arc closed path using the elliptical arc command (M, A, A)
   * - Triangle: Three-point closed path with vertices at top-center, bottom-right, bottom-left
   *
   * @returns An SVG path data string (d attribute) for the shape
   */
  getSvgPath(): string {
    const w = this.width;
    const h = this.height;

    switch (this.shapeType) {
      case ShapeType.Rectangle:
        return `M ${this.x} ${this.y} L ${this.x + w} ${this.y} L ${this.x + w} ${this.y + h} L ${this.x} ${this.y + h} Z`;

      case ShapeType.Ellipse:
        const cx = this.x + w / 2;
        const cy = this.y + h / 2;
        const rx = w / 2;
        const ry = h / 2;
        return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;

      case ShapeType.Triangle:
        const topX = this.x + w / 2;
        const topY = this.y;
        const bottomLeftX = this.x;
        const bottomLeftY = this.y + h;
        const bottomRightX = this.x + w;
        const bottomRightY = this.y + h;
        return `M ${topX} ${topY} L ${bottomRightX} ${bottomRightY} L ${bottomLeftX} ${bottomLeftY} Z`;

      default:
        return `M ${this.x} ${this.y} L ${this.x + w} ${this.y} L ${this.x + w} ${this.y + h} L ${this.x} ${this.y + h} Z`;
    }
  }

  getSupportedExportFormats(): KritzelObjectExportFormat[] {
    return ['svg'];
  }

  async exportAs(format: KritzelObjectExportFormat, context: KritzelObjectExportContext): Promise<string | null> {
    if (format !== 'svg') {
      return null;
    }

    return context.getObjectAsSvgDataUrl(this);
  }
}
