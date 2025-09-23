import { KritzelEventHelper } from '../../helpers/event.helper';
import { AddObjectCommand } from '../commands/add-object.command';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';

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

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._core.state.isDrawing = true;
        const x = event.clientX - this._core.store.offsetX;
        const y = event.clientY - this._core.store.offsetY;

        this._core.state.currentPath = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.state.translateX,
          translateY: -this._core.state.translateY,
          scale: this._core.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.state.pointers.values());

      if (activePointers.length === 1) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.state.isDrawing = true;

        this._core.state.currentPath = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.state.translateX,
          translateY: -this._core.state.translateY,
          scale: this._core.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });

        this._core.rerender();
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.state.isDrawing) {
        const x = event.clientX - this._core.store.offsetX;
        const y = event.clientY - this._core.store.offsetY;

        this._core.state.currentPath = KritzelPath.create(this._core, {
          points: [...this._core.state.currentPath.points, [x, y]],
          translateX: -this._core.state.translateX,
          translateY: -this._core.state.translateY,
          scale: this._core.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });

        this._core.rerender();
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.state.pointers.values());

      if (activePointers.length === 1) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.state.currentPath = KritzelPath.create(this._core, {
          points: [...this._core.state.currentPath.points, [x, y]],
          translateX: -this._core.state.translateX,
          translateY: -this._core.state.translateY,
          scale: this._core.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });

        this._core.rerender();
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.state.isDrawing) {
        this._core.state.isDrawing = false;

        if (this._core.state.currentPath) {
          this._core.state.currentPath.zIndex = this._core.store.currentZIndex;
          this._core.history.executeCommand(new AddObjectCommand(this._core, this, this._core.state.currentPath));
        }

        this._core.state.currentPath = undefined;
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.state.isDrawing) {
        this._core.state.isDrawing = false;

        if (this._core.state.currentPath) {
          this._core.state.currentPath.zIndex = this._core.store.currentZIndex;
          this._core.history.executeCommand(new AddObjectCommand(this._core, this, this._core.state.currentPath));
        }

        this._core.state.currentPath = undefined;

        this._core.rerender();
      }
    }
  }
}
