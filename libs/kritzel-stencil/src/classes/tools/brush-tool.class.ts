import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelStore } from '../store.class';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';

export class KritzelBrushTool extends KritzelBaseTool {
  type: 'pen' | 'highlighter' = 'pen';

  color: string = '#000000';

  size: number = 6;

  palettes: {
    [brushType: string]: string[];
  } = {
    pen: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000', '#800080'],
    highlighter: ['#ffff00', '#ffb347', '#b4ffb4'],
  };

  constructor(store: KritzelStore) {
    super(store);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._store.state.isDrawing = true;
        const x = event.clientX - this._store.offsetX;
        const y = event.clientY - this._store.offsetY;

        this._store.state.currentPath = KritzelPath.create(this._store, {
          points: [[x, y]],
          translateX: -this._store.state.translateX,
          translateY: -this._store.state.translateY,
          scale: this._store.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isDrawing) {
        const x = event.clientX - this._store.offsetX;
        const y = event.clientY - this._store.offsetY;

        this._store.state.currentPath = KritzelPath.create(this._store, {
          points: [...this._store.state.currentPath.points, [x, y]],
          translateX: -this._store.state.translateX,
          translateY: -this._store.state.translateY,
          scale: this._store.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });

        this._store.rerender();
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (this._store.state.isDrawing) {
        this._store.state.isDrawing = false;

        if (this._store.state.currentPath) {
          this._store.state.currentPath.zIndex = this._store.currentZIndex;
          this._store.history.executeCommand(new AddObjectCommand(this._store, this, this._store.state.currentPath));
        }

        this._store.state.currentPath = undefined;
      }
    }
  }

  handleTouchStart(event: TouchEvent): void {
    if (this._store.state.touchCount === 1) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);

      this._store.state.isDrawing = true;

      this._store.state.currentPath = KritzelPath.create(this._store, {
        points: [[x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        fill: this.color,
        strokeWidth: this.size,
      });

      this._store.rerender();
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (this._store.state.touchCount === 1) {
      const x = Math.round(event.touches[0].clientX - this._store.offsetX);
      const y = Math.round(event.touches[0].clientY - this._store.offsetY);

      this._store.state.currentPath = KritzelPath.create(this._store, {
        points: [...this._store.state.currentPath.points, [x, y]],
        translateX: -this._store.state.translateX,
        translateY: -this._store.state.translateY,
        scale: this._store.state.scale,
        fill: this.color,
        strokeWidth: this.size,
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
