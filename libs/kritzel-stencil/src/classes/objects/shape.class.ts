import { KritzelToolRegistry } from '../registries/tool.registry';
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

  scale: number = 1;
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

  constructor(config?: {
    x?: number;
    y?: number;
    translateX?: number;
    translateY?: number;
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

    if (config) {
      this.x = config.x ?? 0;
      this.y = config.y ?? 0;
      this.translateX = config.translateX ?? 0;
      this.translateY = config.translateY ?? 0;
      this.width = config.width ?? 100;
      this.height = config.height ?? 100;
      this.shapeType = config.shapeType ?? ShapeType.Rectangle;
      this.fillColor = config.fillColor ?? { light: 'transparent', dark: 'transparent' };
      this.strokeColor = config.strokeColor ?? { light: '#000000', dark: '#ffffff' };
      this.strokeWidth = config.strokeWidth ?? 4;
      this.fontSize = config.fontSize ?? 16;
      this.fontFamily = config.fontFamily ?? 'Arial';
      this.fontColor = config.fontColor ?? KritzelColorHelper.determineTextColor(this.fillColor);
      this.scale = config.scale ?? 1;
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
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.x = config?.x ?? 0;
    object.y = config?.y ?? 0;
    object.translateX = config?.translateX ?? 0;
    object.translateY = config?.translateY ?? 0;
    object.width = config?.width ?? 100;
    object.height = config?.height ?? 100;
    object.shapeType = config?.shapeType ?? ShapeType.Rectangle;
    object.fillColor = config?.fillColor ?? { light: 'transparent', dark: 'transparent' };
    object.strokeColor = config?.strokeColor ?? { light: '#000000', dark: '#ffffff' };
    object.strokeWidth = config?.strokeWidth ?? 4;
    object.opacity = config?.opacity ?? 1;
    object.fontSize = config?.fontSize ?? 16;
    object.fontFamily = config?.fontFamily ?? 'Arial';
    object.fontColor = config?.fontColor ?? KritzelColorHelper.determineTextColor(object.fillColor);
    object.backgroundColor = { light: 'transparent', dark: 'transparent' };
    object.scaleFactor = 1;
    object.scale = config?.scale ?? core.store.state.scale;
    object.zIndex = core.store.currentZIndex;
    object.editor = object.createEditor();

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

  override mount(element: HTMLDivElement): void {
    if (element === null || this.isInViewport() === false) {
      return;
    }

    if (this.isMounted && this.elementRef === element && this.editor.dom.parentElement === element) {
      return;
    }

    this.elementRef = element;
    this.isMounted = true;
  }

  mountTextEditor(element: HTMLDivElement): void {
    if (element === null) {
      return;
    }

    element.style.fontFamily = this.fontFamily;
    element.style.fontSize = `${this.fontSize}pt`;
    element.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor);
    element.style.whiteSpace = 'pre-wrap';
    element.style.wordWrap = 'break-word';

    if (this.editor.dom.parentElement === element) {
      return;
    }

    element.innerHTML = '';
    element.appendChild(this.editor.dom);
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

        if (transaction.docChanged) {
          this.content = newState.doc.toJSON();

          if (!transaction.getMeta('fromRemote')) {
            this._core.store.state.objects.update(this, { temporary: true });
          }
        }
      },
    });
  }

  public setContent(content: any): void {
    this.content = content;

    if (this.editor && content) {
      const newDoc = this.editor.state.schema.nodeFromJSON(content);
      const tr = this.editor.state.tr.replaceWith(0, this.editor.state.doc.content.size, newDoc.content);

      tr.setMeta('fromRemote', true);
      this.editor.dispatch(tr);
    }
  }

  override resize(x: number, y: number, width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      return;
    }

    this.width = width;
    this.height = height;
    this.translateX = x;
    this.translateY = y;

    this._core.store.state.objects.update(this);
  }

  focus(coords?: { x: number; y: number }): void {
    if (this.editor) {
      const doc = this.editor.state.doc;

      if (coords?.x && coords?.y) {
        const pos = this.editor.posAtCoords({ left: coords.x, top: coords.y });
        if (pos) {
          this.editor.dispatch(this.editor.state.tr.setSelection(TextSelection.create(doc, pos.pos)));
          this.editor.focus();

          if (KritzelDevicesHelper.isIOS()) {
            this.scrollIntoViewOnIOS();
          }
          return;
        }
      }

      const end = Math.max(1, doc.content.size - 1);
      this.editor.dispatch(this.editor.state.tr.setSelection(TextSelection.create(doc, end)));
      this.editor.focus();

      if (KritzelDevicesHelper.isIOS()) {
        this.scrollIntoViewOnIOS();
      }
    }
  }

  private scrollIntoViewOnIOS(): void {
    setTimeout(() => {
      if (this.editor && this.editor.dom) {
        this.editor.dom.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }, 300);
  }

  edit(event?: PointerEvent): void {
    KritzelKeyboardHelper.disableInteractiveWidget();

    this.uneditedObject = this.clone() as KritzelShape;

    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('shape'));

    this.editor.setProps({ editable: () => true });

    this.isEditing = true;

    this._core.rerender();

    this.focus({ x: event?.clientX, y: event?.clientY });

    KritzelKeyboardHelper.enableInteractiveWidget();
  }

  save(): void {
    this.content = this.editor.state.doc.toJSON();

    this.editor.setProps({ editable: () => false });

    this.editor.dom.blur();

    this.isEditing = false;

    this._core.store.state.objects.consolidateTemporaryItems();

    this._core.store.state.objects.update(this);

    this._core.engine.emitObjectsChange();
  }

  handlePointerDown(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (!this.isEditing) {
      return;
    }

    if (!this._core.store.state.pointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  }

  override copy(): KritzelShape {
    const copiedObject = super.copy() as KritzelShape;
    copiedObject.editor = copiedObject.createEditor();

    if (this.content) {
      copiedObject.setContent(this.content);
    }

    return copiedObject;
  }

  override serialize() {
    const { _core, _elementRef, _schema, element, totalWidth, totalHeight, editor, uneditedObject, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    return clonedProps;
  }

  override deserialize<KritzelShape>(object: any): KritzelShape {
    super.deserialize<KritzelShape>(object);
    if (object.content) {
      this.setContent(object.content);
    }
    return this as unknown as KritzelShape;
  }

  /**
   * Called after properties are updated via updateObject.
   * Automatically adjusts text color based on fill color brightness.
   */
  override onAfterUpdate(changedProperties: string[]): void {
    if (changedProperties.includes('fillColor')) {
      this.fontColor = KritzelColorHelper.determineTextColor(this.fillColor);
      // Update the editor's text color immediately
      if (this.editor?.dom?.parentElement) {
        this.editor.dom.parentElement.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor);
      }
    } else if (changedProperties.includes('fontColor')) {
      // Also update editor when fontColor changes directly
      if (this.editor?.dom?.parentElement) {
        this.editor.dom.parentElement.style.color = KritzelColorHelper.resolveThemeColor(this.fontColor);
      }
    }
  }

  /**
   * Returns the clipping polygon for arrow intersection.
   * For ellipse: returns a many-sided polygon approximation
   * For triangle: returns the 3 corners
   * For rectangle: returns null (uses default rotatedPolygon)
   * 
   * Includes padding for half the stroke width so arrow heads don't overlap the stroke.
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
   * Returns the SVG path for rendering the shape.
   * The path uses screen-space coordinates relative to (x, y).
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
}
