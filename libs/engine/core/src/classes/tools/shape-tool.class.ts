import { KritzelShape } from '../objects/shape.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelCore } from '../core/core.class';
import { ShapeType } from '../../enums/shape-type.enum';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../../constants/stroke-size.constants';

/**
 * Shape tool for drawing geometric shapes (rectangles, ellipses, etc.) on the canvas.
 * Creates shapes by tracking a drag gesture to define the bounding box.
 * Supports configurable shape type, fill color, stroke color, stroke width, opacity, and text properties.
 * Automatically switches to selection tool after shape completion.
 */
export class KritzelShapeTool extends KritzelBaseTool {
  override toolType = 'shape' as const;

  /** The type of shape to create (rectangle, ellipse, etc.) */
  shapeType: ShapeType = ShapeType.Rectangle;

  /** The fill color of the shape (supports theme-aware light/dark colors) */
  fillColor: ThemeAwareColor = { light: 'transparent', dark: 'transparent' };

  /** The stroke color of the shape border */
  strokeColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  /** The stroke width of the shape border in pixels */
  strokeWidth: number = 4;

  /** The opacity of the shape (0-1) */
  opacity: number = 1;

  /** The font family for text inside the shape */
  fontFamily: string = 'Arial';

  /** The font size for text inside the shape in pixels */
  fontSize: number = 16;

  /** The font color for text inside the shape */
  fontColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  /** Available color palette for the shape tool */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /** Available stroke size presets for the shape tool */
  sizes: number[] = [...DEFAULT_STROKE_SIZES];

  /** X coordinate where the shape drawing started */
  private startX: number = 0;

  /** Y coordinate where the shape drawing started */
  private startY: number = 0;

  /** Whether currently drawing a shape */
  private isDrawing: boolean = false;

  /** Reference to the shape being drawn */
  private currentShape: KritzelShape | null = null;

  /**
   * Creates a new instance of KritzelShapeTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles pointer down events to start drawing a new shape or edit an existing one.
   * If clicking on an existing shape, enters edit mode to modify its text content.
   * Otherwise, begins drawing a new shape at the pointer position.
   * @param event - The PointerEvent containing pointer position and input type information
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._core.findObjectById(objectElement?.id);

      const activeShape = this._core.store.activeShape;

      if (activeShape === null && object instanceof KritzelShape) {
        object.edit(event);
        return;
      }

      if (activeShape !== null && object instanceof KritzelShape) {
        activeShape.save();
        object.edit(event);
        return;
      }

      if (activeShape !== null && object instanceof KritzelShape === false) {
        this._core.resetActiveShape();
        this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
        return;
      }

      if (KritzelEventHelper.isLeftClick(event) === false) {
        return;
      }

      this.startDrawing(event.clientX, event.clientY);
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      const path = event.composedPath().slice(1) as HTMLElement[];
      const objectElement = path.find(element => element.classList && element.classList.contains('object'));
      const object = this._core.findObjectById(objectElement?.id);

      const activeShape = this._core.store.activeShape;

      if (activeShape === null && object instanceof KritzelShape) {
        object.edit(event);
        return;
      }

      if (activeShape !== null && object instanceof KritzelShape) {
        activeShape.save();
        object.edit(event);
        return;
      }

      if (activeShape !== null && object instanceof KritzelShape === false) {
        this._core.resetActiveShape();
        this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
        return;
      }

      if (activePointers.length > 1) {
        return;
      }

      const clientX = Math.round(activePointers[0].clientX);
      const clientY = Math.round(activePointers[0].clientY);
      this.startDrawing(clientX, clientY);
    }
  }

  /**
   * Handles pointer move events to update the shape size while drawing.
   * Updates the current shape's dimensions based on the distance from the start point.
   * Only processes events when actively drawing a shape.
   * @param event - The PointerEvent containing the current pointer position
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (!this.isDrawing || !this.currentShape) {
      return;
    }

    if (event.pointerType === 'mouse') {
      this.updateShapeSize(event.clientX, event.clientY);
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const clientX = Math.round(activePointers[0].clientX);
        const clientY = Math.round(activePointers[0].clientY);
        this.updateShapeSize(clientX, clientY);
      }
    }
  }

  /**
   * Handles pointer up events to complete the shape drawing.
   * Finalizes the shape if large enough, or removes it if too small (accidental click).
   * Switches to selection tool with the shape selected after completion.
   * @param event - The PointerEvent indicating the end of the drawing gesture
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (!this.isDrawing || !this.currentShape) {
      return;
    }

    this.finishDrawing();
  }

  /**
   * Initializes the shape drawing process at the given screen coordinates.
   * Creates a new KritzelShape object with initial dimensions of 1x1 pixel.
   * Follows the same coordinate pattern as LineTool/BrushTool for consistency.
   * @param clientX - The X coordinate in screen/client space
   * @param clientY - The Y coordinate in screen/client space
   */
  private startDrawing(clientX: number, clientY: number): void {
    // Store screen coordinates (relative to host element)
    const viewportScale = this._core.store.state.scale;
    const lockScale = this._core.store.state.lockDrawingScale;
    const divider = lockScale ? viewportScale : 1;
    this.startX = (clientX - this._core.store.offsetX) / divider;
    this.startY = (clientY - this._core.store.offsetY) / divider;
    this.isDrawing = true;

    // Create shape using screen coordinates, following Path/Line pattern
    this.currentShape = KritzelShape.create(this._core, {
      x: this.startX,
      y: this.startY,
      translateX: -this._core.store.state.translateX / divider,
      translateY: -this._core.store.state.translateY / divider,
      width: 1,
      height: 1,
      shapeType: this.shapeType,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      scale: lockScale ? 1 : viewportScale,
    });

    this._core.store.objects.insert(this.currentShape);
    this._core.store.objects?.setActiveDrawingObject(this.currentShape.id);
    this._core.rerender();
  }

  /**
   * Updates the shape's dimensions based on the current pointer position.
   * Calculates the bounding box from start point to current point and updates
   * the shape's position and size accordingly. Handles negative drag directions.
   * @param clientX - The current X coordinate in screen/client space
   * @param clientY - The current Y coordinate in screen/client space
   */
  private updateShapeSize(clientX: number, clientY: number): void {
    if (!this.currentShape) {
      return;
    }

    const viewportScale = this._core.store.state.scale;
    const lockScale = this._core.store.state.lockDrawingScale;
    const divider = lockScale ? viewportScale : 1;
    const currentX = (clientX - this._core.store.offsetX) / divider;
    const currentY = (clientY - this._core.store.offsetY) / divider;

    // Calculate bounding box in screen coordinates
    const minX = Math.min(this.startX, currentX);
    const minY = Math.min(this.startY, currentY);
    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);

    // Update shape with screen coordinates
    this.currentShape.x = minX;
    this.currentShape.y = minY;
    this.currentShape.width = Math.max(1, width);
    this.currentShape.height = Math.max(1, height);

    // Recalculate world-space translateX/Y
    // Reset translateX/Y to initial value before updateDimensions
    this.currentShape.translateX = -this._core.store.state.translateX / divider;
    this.currentShape.translateY = -this._core.store.state.translateY / divider;
    this.currentShape.updateDimensions();

    this._core.store.objects.update(this.currentShape);
  }

  /**
   * Completes the shape drawing process.
   * Removes shapes smaller than 10x10 pixels (accidental clicks).
   * For valid shapes, assigns z-index, updates the store, emits change event,
   * selects the shape, and switches to selection tool.
   */
  private finishDrawing(): void {
    if (!this.currentShape) {
      return;
    }

    // Remove shape if it's too small (likely an accidental click)
    // Compare in screen space
    if (this.currentShape.width < 10 && this.currentShape.height < 10) {
      const shapeId = this.currentShape.id;
      this._core.store.objects.remove(o => o.id === shapeId);
    } else {
      this.currentShape.zIndex = this._core.store.currentZIndex;
      this._core.store.objects.update(this.currentShape);
      this._core.engine.emitObjectsChange();
      this._core.engine.emitObjectsAdded([this.currentShape]);
      this._core.selectObjects([this.currentShape]);
      this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));
    }

    this.isDrawing = false;
    this._core.store.objects?.setActiveDrawingObject(null);
    this.currentShape = null;
    this._core.store.objects?.stopUndoCapturing();
    this._core.rerender();
  }
}
