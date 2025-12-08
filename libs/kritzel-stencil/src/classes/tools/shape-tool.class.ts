import { KritzelShape } from '../objects/shape.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelCore } from '../core/core.class';
import { ShapeType } from '../../enums/shape-type.enum';

export class KritzelShapeTool extends KritzelBaseTool {
  shapeType: ShapeType = ShapeType.Rectangle;
  fillColor: string = 'transparent';
  strokeColor: string = '#000000';
  strokeWidth: number = 4;
  fontFamily: string = 'Arial';
  fontSize: number = 16;
  fontColor: string = '#000000';

  palette: string[] = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#808080',
    '#C0C0C0',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#800080',
  ];

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

  private startDrawing(clientX: number, clientY: number): void {
    this.startX = clientX - this._core.store.offsetX;
    this.startY = clientY - this._core.store.offsetY;
    this.isDrawing = true;

    const translateX = (this.startX - this._core.store.state.translateX) / this._core.store.state.scale;
    const translateY = (this.startY - this._core.store.state.translateY) / this._core.store.state.scale;

    this.currentShape = KritzelShape.create(this._core, {
      translateX,
      translateY,
      width: 1,
      height: 1,
      shapeType: this.shapeType,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontColor: this.fontColor,
    });

    this._core.store.state.objects.insert(this.currentShape);
    this._core.rerender();
  }

  private updateShapeSize(clientX: number, clientY: number): void {
    if (!this.currentShape) {
      return;
    }

    const currentX = clientX - this._core.store.offsetX;
    const currentY = clientY - this._core.store.offsetY;

    const startXCanvas = (this.startX - this._core.store.state.translateX) / this._core.store.state.scale;
    const startYCanvas = (this.startY - this._core.store.state.translateY) / this._core.store.state.scale;
    const currentXCanvas = (currentX - this._core.store.state.translateX) / this._core.store.state.scale;
    const currentYCanvas = (currentY - this._core.store.state.translateY) / this._core.store.state.scale;

    const minX = Math.min(startXCanvas, currentXCanvas);
    const minY = Math.min(startYCanvas, currentYCanvas);
    const width = Math.abs(currentXCanvas - startXCanvas);
    const height = Math.abs(currentYCanvas - startYCanvas);

    this.currentShape.translateX = minX;
    this.currentShape.translateY = minY;
    this.currentShape.width = Math.max(1, width);
    this.currentShape.height = Math.max(1, height);

    this._core.store.state.objects.update(this.currentShape);
  }

  private finishDrawing(): void {
    if (!this.currentShape) {
      return;
    }

    // Remove shape if it's too small (likely an accidental click)
    if (this.currentShape.width < 10 && this.currentShape.height < 10) {
      const shapeId = this.currentShape.id;
      this._core.store.state.objects.remove(o => o.id === shapeId);
    } else {
      this.currentShape.zIndex = this._core.store.currentZIndex;
      this._core.store.state.objects.update(this.currentShape);
      this._core.engine.emitObjectsChange();
    }

    this.isDrawing = false;
    this.currentShape = null;
    this._core.rerender();
  }
}
