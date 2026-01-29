import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';
import { DEFAULT_COLOR_PALETTE } from '../../constants/color-palette.constants';

export class KritzelBrushTool extends KritzelBaseTool {
  color: string = '#000000';

  size: number = 6;

  opacity: number = 1;

  palette: string[] = [...DEFAULT_COLOR_PALETTE];

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
        const viewportScale = this._core.store.state.scale;
        const lockScale = this._core.store.state.lockDrawingScale;
        const divider = lockScale ? viewportScale : 1;
        const x = (event.clientX - this._core.store.offsetX) / divider;
        const y = (event.clientY - this._core.store.offsetY) / divider;

        const path = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.store.state.translateX / divider,
          translateY: -this._core.store.state.translateY / divider,
          scale: lockScale ? 1 : viewportScale,
          fill: this.color,
          strokeWidth: this.size,
          opacity: this.opacity,
        });
        path.isCompleted = false;

        this._currentPathId = path.id;
        this._core.store.state.objects.insert(path);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const viewportScale = this._core.store.state.scale;
        const lockScale = this._core.store.state.lockDrawingScale;
        const divider = lockScale ? viewportScale : 1;
        const x = Math.round((activePointers[0].clientX - this._core.store.offsetX) / divider);
        const y = Math.round((activePointers[0].clientY - this._core.store.offsetY) / divider);

        this._core.store.state.isDrawing = true;

        const path = KritzelPath.create(this._core, {
          points: [[x, y]],
          translateX: -this._core.store.state.translateX / divider,
          translateY: -this._core.store.state.translateY / divider,
          scale: lockScale ? 1 : viewportScale,
          fill: this.color,
          strokeWidth: this.size,
          opacity: this.opacity,
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
          const viewportScale = this._core.store.state.scale;
          const lockScale = this._core.store.state.lockDrawingScale;
          const divider = lockScale ? viewportScale : 1;
          const x = (event.clientX - this._core.store.offsetX) / divider;
          const y = (event.clientY - this._core.store.offsetY) / divider;

          const updatedPath = KritzelPath.create(this._core, {
            points: [...currentPath.points, [x, y]],
            translateX: -this._core.store.state.translateX / divider,
            translateY: -this._core.store.state.translateY / divider,
            scale: lockScale ? 1 : viewportScale,
            fill: this.color,
            strokeWidth: this.size,
            opacity: this.opacity,
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
            const viewportScale = this._core.store.state.scale;
            const lockScale = this._core.store.state.lockDrawingScale;
            const divider = lockScale ? viewportScale : 1;
            const x = Math.round((activePointers[0].clientX - this._core.store.offsetX) / divider);
            const y = Math.round((activePointers[0].clientY - this._core.store.offsetY) / divider);

            const updatedPath = KritzelPath.create(this._core, {
              points: [...currentPath.points, [x, y]],
              translateX: -this._core.store.state.translateX / divider,
              translateY: -this._core.store.state.translateY / divider,
              scale: lockScale ? 1 : viewportScale,
              fill: this.color,
              strokeWidth: this.size,
              opacity: this.opacity,
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
