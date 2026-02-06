import { KritzelShape } from '../objects/shape.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';
import { ShapeType } from '../../enums/shape-type.enum';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';

export class KritzelShapeTool extends KritzelBaseTool {
  shapeType: ShapeType = ShapeType.Rectangle;
  fillColor: ThemeAwareColor = { light: 'transparent', dark: 'transparent' };
  strokeColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];
  strokeWidth: number = 4;
  opacity: number = 1;
  fontFamily: string = 'Arial';
  fontSize: number = 16;
  fontColor: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  private startX: number = 0;
  private startY: number = 0;
  private isDrawing: boolean = false;
  private currentShape: KritzelShape | null = null;

  constructor(core: KritzelCore) {
    super(core);
  }

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
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
        return;
      }

      if (KritzelEventHelper.isLeftClick(event) === false) {
        return;
      }

      this.startDrawing(event.clientX, event.clientY);
    }

    if (event.pointerType === 'touch') {
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
        this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
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

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const clientX = Math.round(activePointers[0].clientX);
        const clientY = Math.round(activePointers[0].clientY);
        this.updateShapeSize(clientX, clientY);
      }
    }
  }

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
   * Start drawing a shape. Following the same pattern as LineTool/BrushTool:
   * - Store screen coordinates for startX, startY
   * - Set translateX/Y to -viewportTranslateX/Y (viewport offset)
   * - Set x, y to the actual screen position
   * - Let updateDimensions() convert to world coordinates
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
      fontColor: this.fontColor,
      scale: lockScale ? 1 : viewportScale,
    });

    this._core.store.state.objects.insert(this.currentShape);
    this._core.rerender();
  }

  /**
   * Update shape size during drawing. Following the same pattern as LineTool:
   * - Use screen coordinates directly
   * - The shape's x, y, width, height are all in screen space
   * - updateDimensions() handles conversion to world coordinates
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

    this._core.store.state.objects.update(this.currentShape);
  }

  private finishDrawing(): void {
    if (!this.currentShape) {
      return;
    }

    // Remove shape if it's too small (likely an accidental click)
    // Compare in screen space
    if (this.currentShape.width < 10 && this.currentShape.height < 10) {
      const shapeId = this.currentShape.id;
      this._core.store.state.objects.remove(o => o.id === shapeId);
    } else {
      this.currentShape.zIndex = this._core.store.currentZIndex;
      this._core.store.state.objects.update(this.currentShape);
      this._core.engine.emitObjectsChange();
      this._core.selectObjects([this.currentShape]);
      this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));
    }

    this.isDrawing = false;
    this.currentShape = null;
    this._core.rerender();
  }
}
