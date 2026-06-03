import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { LineArrowConfig } from '../../interfaces/arrow-head.interface';
import { DEFAULT_COLOR_PALETTE, ThemeAwareColor } from '../../constants/color-palette.constants';
import { DEFAULT_STROKE_SIZES } from '../../constants/stroke-size.constants';

/**
 * Line tool for drawing straight lines on the canvas.
 * Creates lines by tracking the start and end points of a drag gesture.
 * Supports configurable stroke color, width, opacity, and arrow heads.
 * Automatically switches to selection tool after line completion.
 */
export class KritzelLineTool extends KritzelBaseTool {
  override toolType = 'line' as const;

  /** The stroke color of the line (supports theme-aware light/dark colors) */
  color: ThemeAwareColor = DEFAULT_COLOR_PALETTE[0];

  /** The stroke width of the line in pixels */
  size: number = 4;

  /** The opacity of the line (0-1) */
  opacity: number = 1;

  /** Available color palette for the line tool */
  palette: ThemeAwareColor[] = [...DEFAULT_COLOR_PALETTE];

  /** Available stroke size presets for the line tool */
  sizes: number[] = [...DEFAULT_STROKE_SIZES];

  /** Arrow head configuration for lines created with this tool */
  arrows?: LineArrowConfig;

  /** X coordinate of the line's starting point */
  private _startX: number = 0;

  /** Y coordinate of the line's starting point */
  private _startY: number = 0;

  /** Tracks the ID of the line currently being drawn */
  private _currentLineId: string | null = null;

  /**
   * Creates a new instance of KritzelLineTool.
   * @param core - The KritzelCore instance that provides access to application state and functionality
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles pointer down events to start drawing a new line.
   * Creates a new KritzelLine object at the pointer position with start and end points at the same location.
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

        this._startX = x;
        this._startY = y;

        const line = KritzelLine.create(this._core, {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          translateX: -this._core.store.state.translateX / divider,
          translateY: -this._core.store.state.translateY / divider,
          scale: lockScale ? 1 : viewportScale,
          stroke: this.color,
          strokeWidth: this.size,
          opacity: this.opacity,
          arrows: this.arrows,
        });
        line.isCompleted = false;

        this._currentLineId = line.id;
        this._core.store.objects.insert(line);
        this._core.store.objects?.setActiveDrawingObject(line.id);
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
        this._startX = x;
        this._startY = y;

        const line = KritzelLine.create(this._core, {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          translateX: -this._core.store.state.translateX / divider,
          translateY: -this._core.store.state.translateY / divider,
          scale: lockScale ? 1 : viewportScale,
          stroke: this.color,
          strokeWidth: this.size,
          opacity: this.opacity,
          arrows: this.arrows,
        });
        line.isCompleted = false;

        this._currentLineId = line.id;
        this._core.store.objects.insert(line);
        this._core.store.objects?.setActiveDrawingObject(line.id);
      }
    }
  }

  /**
   * Handles pointer move events to update the line's end point while drawing.
   * Updates the current line's end coordinates to follow the pointer position.
   * Only processes events when actively drawing (isDrawing state is true).
   * @param event - The PointerEvent containing the current pointer position
   */
  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing && this._currentLineId) {
        const currentLine = this._core.store.objects.findById(this._currentLineId) as KritzelLine | undefined;
        if (currentLine) {
          const viewportScale = this._core.store.state.scale;
          const lockScale = this._core.store.state.lockDrawingScale;
          const divider = lockScale ? viewportScale : 1;
          const x = (event.clientX - this._core.store.offsetX) / divider;
          const y = (event.clientY - this._core.store.offsetY) / divider;

          const updatedLine = KritzelLine.create(this._core, {
            startX: this._startX,
            startY: this._startY,
            endX: x,
            endY: y,
            translateX: -this._core.store.state.translateX / divider,
            translateY: -this._core.store.state.translateY / divider,
            scale: lockScale ? 1 : viewportScale,
            stroke: this.color,
            strokeWidth: this.size,
            opacity: this.opacity,
            arrows: this.arrows,
          });
          updatedLine.id = currentLine.id;
          updatedLine.workspaceId = currentLine.workspaceId;
          updatedLine.zIndex = currentLine.zIndex;
          updatedLine.isCompleted = false;

          this._core.store.objects.update(updatedLine);
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1 && this._currentLineId) {
        const currentLine = this._core.store.objects.findById(this._currentLineId) as KritzelLine | undefined;
        if (currentLine) {
          const viewportScale = this._core.store.state.scale;
          const lockScale = this._core.store.state.lockDrawingScale;
          const divider = lockScale ? viewportScale : 1;
          const x = Math.round((activePointers[0].clientX - this._core.store.offsetX) / divider);
          const y = Math.round((activePointers[0].clientY - this._core.store.offsetY) / divider);

          const updatedLine = KritzelLine.create(this._core, {
            startX: this._startX,
            startY: this._startY,
            endX: x,
            endY: y,
            translateX: -this._core.store.state.translateX / divider,
            translateY: -this._core.store.state.translateY / divider,
            scale: lockScale ? 1 : viewportScale,
            stroke: this.color,
            strokeWidth: this.size,
            opacity: this.opacity,
            arrows: this.arrows,
          });
          updatedLine.id = currentLine.id;
          updatedLine.workspaceId = currentLine.workspaceId;
          updatedLine.zIndex = currentLine.zIndex;
          updatedLine.isCompleted = false;

          this._core.store.objects.update(updatedLine);
        }
      }
    }
  }

  /**
   * Handles pointer up events to complete the current line.
   * Marks the line as completed, updates the store, emits an objects change event,
   * and switches to selection tool with the drawn line selected.
   * @param event - The PointerEvent indicating the end of the drawing gesture
   */
  handlePointerUp(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentLineId) {
          const currentLine = this._core.store.objects.findById(this._currentLineId) as KritzelLine | undefined;
          if (currentLine) {
            currentLine.isCompleted = true;
            this._core.store.objects.update(currentLine);
            this._core.engine.emitObjectsChange();
            this._core.engine.emitObjectsAdded([currentLine]);

            // Switch to selection tool and select the drawn line
            this.selectLineAndSwitchTool(currentLine);
          }
          this._core.store.objects?.setActiveDrawingObject(null);
          this._currentLineId = null;
          this._core.store.objects?.stopUndoCapturing();
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        if (this._currentLineId) {
          const currentLine = this._core.store.objects.findById(this._currentLineId) as KritzelLine | undefined;
          if (currentLine) {
            currentLine.isCompleted = true;
            this._core.store.objects.update(currentLine);
            this._core.engine.emitObjectsChange();
            this._core.engine.emitObjectsAdded([currentLine]);

            // Switch to selection tool and select the drawn line
            this.selectLineAndSwitchTool(currentLine);
          }
          this._core.store.objects?.setActiveDrawingObject(null);
          this._currentLineId = null;
          this._core.store.objects?.stopUndoCapturing();
        }
      }
    }
  }

  /**
   * Creates a selection group with the drawn line, selects it, and switches to the selection tool.
   * This provides immediate editing capability for the newly drawn line.
   * @param line - The KritzelLine object to select
   */
  private selectLineAndSwitchTool(line: KritzelLine): void {
    // Create a selection group with the drawn line
    const selectionGroup = KritzelSelectionGroup.create(this._core);
    selectionGroup.addOrRemove(line);
    selectionGroup.isSelected = true;
    selectionGroup.rotation = line.rotation;

    // Add the selection group
    this._core.addSelectionGroup(selectionGroup);

    // Switch to selection tool
    this._core.store.setState('activeTool', this._core.toolRegistry.getTool('selection'));

    // Rerender
    this._core.rerender();
  }
}
