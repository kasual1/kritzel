import { KritzelEventHelper } from '../../helpers/event.helper';
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
      pen: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#800080'],
      highlighter: ['#ffff00', '#ffb347', '#b4ffb4'],
    };

  private _currentPathId: string | null = null;

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this._core.store.state.isDrawing = true;
        const x = event.clientX - this._core.store.offsetX;
        const y = event.clientY - this._core.store.offsetY;

        const path = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.store.state.translateX,
          translateY: -this._core.store.state.translateY,
          scale: this._core.store.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });
        path.isCompleted = false;

        this._currentPathId = path.id;
        this._core.store.state.objects.insert(path);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.store.state.isDrawing = true;

        const path = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.store.state.translateX,
          translateY: -this._core.store.state.translateY,
          scale: this._core.store.state.scale,
          fill: this.color,
          strokeWidth: this.size,
        });
        path.isCompleted = false;

        this._currentPathId = path.id;
        this._core.store.state.objects.insert(path);
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing && this._currentPathId) {
        const matchingObjects = this._core.store.state.objects.filter(o => o.id === this._currentPathId);
        const currentPath = matchingObjects.length > 0 ? (matchingObjects[0] as KritzelPath) : null;

        if (currentPath) {
          const x = event.clientX - this._core.store.offsetX;
          const y = event.clientY - this._core.store.offsetY;

          const updatedPath = KritzelPath.create(this._core, {
            points: [...currentPath.points, [x, y]],
            translateX: -this._core.store.state.translateX,
            translateY: -this._core.store.state.translateY,
            scale: this._core.store.state.scale,
            fill: this.color,
            strokeWidth: this.size,
          });
          updatedPath.id = currentPath.id;
          updatedPath.workspaceId = currentPath.workspaceId;
          updatedPath.zIndex = currentPath.zIndex;
          updatedPath.isCompleted = false;

          this._core.store.state.objects.update(updatedPath);
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        if (this._currentPathId) {
          const matchingObjects = this._core.store.state.objects.filter(o => o.id === this._currentPathId);
          const currentPath = matchingObjects.length > 0 ? (matchingObjects[0] as KritzelPath) : null;

          if (currentPath) {
            const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
            const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

            const updatedPath = KritzelPath.create(this._core, {
              points: [...currentPath.points, [x, y]],
              translateX: -this._core.store.state.translateX,
              translateY: -this._core.store.state.translateY,
              scale: this._core.store.state.scale,
              fill: this.color,
              strokeWidth: this.size,
            });
            updatedPath.id = currentPath.id;
            updatedPath.workspaceId = currentPath.workspaceId;
            updatedPath.zIndex = currentPath.zIndex;
            updatedPath.isCompleted = false;

            this._core.store.state.objects.update(updatedPath);
          }
        }
      }
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentPathId) {
          const matchingObjects = this._core.store.state.objects.filter(o => o.id === this._currentPathId);
          const currentPath = matchingObjects.length > 0 ? (matchingObjects[0] as KritzelPath) : null;

          if (currentPath) {
            currentPath.isCompleted = true;
            this._core.store.state.objects.update(currentPath);
            this._core.engine.emitObjectsChange();
          }
          this._currentPathId = null;
        }
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentPathId) {
          const matchingObjects = this._core.store.state.objects.filter(o => o.id === this._currentPathId);
          const currentPath = matchingObjects.length > 0 ? (matchingObjects[0] as KritzelPath) : null;

          if (currentPath) {
            currentPath.isCompleted = true;
            this._core.store.state.objects.update(currentPath);
            this._core.engine.emitObjectsChange();
          }
          this._currentPathId = null;
        }
      }
    }
  }
}
