import { KritzelClickHelper } from '../../helpers/click.helper';
import { KritzelStore } from '../store.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelBrushTool extends KritzelBaseTool {
  color: string = '#000000';

  size: number = 6;

  constructor(store: KritzelStore) {
    super(store);
  }

  handleMouseDown(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this._store.state.isDrawing = true;
      const x = event.clientX - this._store.offsetX;
      const y = event.clientY - this._store.offsetY;

      this._store.state.currentPath = new KritzelPath(this._store, {
        points: [[x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        stroke: this.color,
        fill: this.color,
        strokeWidth: this.size
      });
    }
  }

  handleMouseMove(event: MouseEvent): void {
    if (this._store.state.isDrawing) {
      const x = event.clientX - this._store.offsetX;
      const y = event.clientY - this._store.offsetY;

      this._store.state.currentPath = new KritzelPath(this._store,{
        points: [...this._store.state.currentPath.points, [x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        stroke: this.color,
        fill: this.color,
        strokeWidth: this.size
      });

      this._store.rerender();
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (this._store.state.isDrawing) {
      this._store.state.isDrawing = false;

      if(this._store.state.currentPath){
        this._store.state.currentPath.zIndex = this._store.currentZIndex;
        this._store.history.executeCommand(new AddObjectCommand(this._store, this, this._store.state.currentPath));
      }

      this._store.state.currentPath = undefined;
    }
  }

  handleTouchStart(event: TouchEvent): void {
    if (this._store.state.touchCount === 1) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);

      this._store.state.isDrawing = true;
      this._store.state.currentPath = new KritzelPath(this._store, {
        points: [[x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        stroke: this.color,
        fill: this.color,
        strokeWidth: this.size
      });

      this._store.rerender();
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (this._store.state.touchCount === 1) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);

      this._store.state.currentPath = new KritzelPath(this._store, {
        points: [...this._store.state.currentPath.points, [x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        stroke: this.color,
        fill: this.color,
        strokeWidth: this.size
      });

      this._store.rerender();
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
    if (this._store.state.isDrawing) {
      this._store.state.isDrawing = false;

      if (this._store.state.currentPath) {
        this._store.state.currentPath.zIndex = this._store.currentZIndex;
        this._store.history.executeCommand(new AddObjectCommand(this._store, this, this._store.state.currentPath));
      }

      this._store.state.currentPath = undefined;

      this._store.rerender();
    }
  }
}
