import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelPath } from '../objects/path.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../../constants/stroke-size.constants';

/**
 * Brush tool for free-hand drawing on the canvas.
 * Creates smooth paths by tracking pointer movement and rendering stroke paths.
 * Supports mouse, touch, and pen input with configurable color, size, and opacity.
 */
export class KritzelBrushTool extends KritzelBaseTool {
  override toolType = 'brush' as const;

  /** The color of the brush stroke (supports theme-aware light/dark colors) */
  color: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  /** The width of the brush stroke in pixels */
  size: number = 6;

  /** The opacity of the brush stroke (0-1) */
  opacity: number = 1;

  /** Available color palette for the brush tool */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /** Available stroke size presets for the brush tool */
  sizes: number[] = [...DEFAULT_STROKE_SIZES];

  /**
   * Minimum distance in screen pixels between two consecutive stored points.
   * Pointer-move samples closer than this to the previously stored point are
   * dropped. This shrinks the path's `points` array (which is fully
   * re-serialized on every Yjs update during a stroke), reducing per-stroke
   * websocket traffic without visible quality loss — `perfect-freehand`
   * already smooths the rendered stroke.
   */
  static readonly MIN_POINT_DISTANCE_PX = 3;

  /** Tracks the ID of the path currently being drawn */
  private _currentPathId: string | null = null;

  /**
   * Returns true if (x, y) is far enough from the last stored point on
   * `currentPath` to be appended. Distance is measured in the same coordinate
   * system the points themselves are stored in (world units when
   * lockDrawingScale is true, screen units otherwise), with the threshold
   * scaled by `divider` so the filter is always ~1 screen pixel.
   *
   * Uses squared distance to avoid a per-move `Math.sqrt`.
   */
  private shouldAppendPoint(currentPath: KritzelPath, x: number, y: number, divider: number): boolean {
    const points = currentPath.points;
    if (!points || points.length === 0) {
      return true;
    }
    const last = points[points.length - 1];
    const dx = x - last[0];
    const dy = y - last[1];
    const threshold = KritzelBrushTool.MIN_POINT_DISTANCE_PX / divider;
    return dx * dx + dy * dy >= threshold * threshold;
  }

  /**
   * Creates a new instance of KritzelBrushTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles pointer down events to start drawing a new path.
   * Creates a new KritzelPath object at the pointer position and adds it to the canvas.
   * Supports both mouse (left-click) and touch/pen input.
   * @param event - The PointerEvent containing pointer position and input type information
   */
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
        this._core.store.objects.insert(path);
        this._core.store.objects?.setActiveDrawingObject(path.id);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
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
        this._core.store.objects.insert(path);
        this._core.store.objects?.setActiveDrawingObject(path.id);
      }
    }
  }

  /**
   * Handles pointer move events to extend the current path while drawing.
   * Adds new points to the current path as the pointer moves across the canvas.
   * Only processes events when actively drawing (isDrawing state is true).
   * @param event - The PointerEvent containing the current pointer position
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing && this._currentPathId) {
        const currentPath = this._core.store.objects.findById(this._currentPathId) as KritzelPath | undefined;

        if (currentPath) {
          const viewportScale = this._core.store.state.scale;
          const lockScale = this._core.store.state.lockDrawingScale;
          const divider = lockScale ? viewportScale : 1;
          const x = (event.clientX - this._core.store.offsetX) / divider;
          const y = (event.clientY - this._core.store.offsetY) / divider;

          if (!this.shouldAppendPoint(currentPath, x, y, divider)) {
            return;
          }

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

          this._core.store.objects.update(updatedPath);
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        if (this._currentPathId) {
          const currentPath = this._core.store.objects.findById(this._currentPathId) as KritzelPath | undefined;

          if (currentPath) {
            const viewportScale = this._core.store.state.scale;
            const lockScale = this._core.store.state.lockDrawingScale;
            const divider = lockScale ? viewportScale : 1;
            const x = Math.round((activePointers[0].clientX - this._core.store.offsetX) / divider);
            const y = Math.round((activePointers[0].clientY - this._core.store.offsetY) / divider);

            if (!this.shouldAppendPoint(currentPath, x, y, divider)) {
              return;
            }

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

            this._core.store.objects.update(updatedPath);
          }
        }
      }
    }
  }

  /**
   * Handles pointer up events to complete the current path.
   * Marks the path as completed, updates the store, and emits an objects change event.
   * Resets the drawing state and clears the current path reference.
   * @param event - The PointerEvent indicating the end of the drawing gesture
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentPathId) {
          const currentPath = this._core.store.objects.findById(this._currentPathId) as KritzelPath | undefined;

          if (currentPath) {
            currentPath.isCompleted = true;
            this._core.store.objects.update(currentPath);
            this._core.engine.emitObjectsChange();
            this._core.engine.emitObjectsAdded([currentPath]);
          }
          this._core.store.objects?.setActiveDrawingObject(null);
          this._currentPathId = null;
          this._core.store.objects?.stopUndoCapturing();
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentPathId) {
          const currentPath = this._core.store.objects.findById(this._currentPathId) as KritzelPath | undefined;

          if (currentPath) {
            currentPath.isCompleted = true;
            this._core.store.objects.update(currentPath);
            this._core.engine.emitObjectsChange();
            this._core.engine.emitObjectsAdded([currentPath]);
          }
          this._core.store.objects?.setActiveDrawingObject(null);
          this._currentPathId = null;
          this._core.store.objects?.stopUndoCapturing();
        }
      }
    }
  }
}
