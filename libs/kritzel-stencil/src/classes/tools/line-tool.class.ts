import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseTool } from './base-tool.class';
import { KritzelCore } from '../core/core.class';
import { KritzelToolRegistry } from '../registries/tool.registry';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { LineArrowConfig } from '../../interfaces/arrow-head.interface';

export class KritzelLineTool extends KritzelBaseTool {
  color: string = '#000000';

  size: number = 4;

  palettes: string[] = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0', '#800000', '#008000', '#000080', '#808000', '#800080'];

  /** Arrow head configuration for lines created with this tool */
  arrows?: LineArrowConfig;

  private _startX: number = 0;
  private _startY: number = 0;

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

        this._startX = x;
        this._startY = y;

        const line = KritzelLine.create(this._core, {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          translateX: -this._core.store.state.translateX,
          translateY: -this._core.store.state.translateY,
          scale: this._core.store.state.scale,
          stroke: this.color,
          strokeWidth: this.size,
          arrows: this.arrows,
        });
        line.isCompleted = false;

        this._core.store.state.objects.insert(line);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
        const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

        this._core.store.state.isDrawing = true;
        this._startX = x;
        this._startY = y;

        const line = KritzelLine.create(this._core, {
          startX: x,
          startY: y,
          endX: x,
          endY: y,
          translateX: -this._core.store.state.translateX,
          translateY: -this._core.store.state.translateY,
          scale: this._core.store.state.scale,
          stroke: this.color,
          strokeWidth: this.size,
          arrows: this.arrows,
        });
        line.isCompleted = false;

        this._core.store.state.objects.insert(line);
      }
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isDrawing) {
        const currentLine = this._core.store.currentLine;
        if (currentLine) {
          const x = event.clientX - this._core.store.offsetX;
          const y = event.clientY - this._core.store.offsetY;

          const updatedLine = KritzelLine.create(this._core, {
            startX: this._startX,
            startY: this._startY,
            endX: x,
            endY: y,
            translateX: -this._core.store.state.translateX,
            translateY: -this._core.store.state.translateY,
            scale: this._core.store.state.scale,
            stroke: this.color,
            strokeWidth: this.size,
            arrows: this.arrows,
          });
          updatedLine.id = currentLine.id;
          updatedLine.workspaceId = currentLine.workspaceId;
          updatedLine.isCompleted = false;

          this._core.store.state.objects.update(updatedLine);
        }
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      if (activePointers.length === 1) {
        const currentLine = this._core.store.currentLine;
        if (currentLine) {
          const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
          const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

          const updatedLine = KritzelLine.create(this._core, {
            startX: this._startX,
            startY: this._startY,
            endX: x,
            endY: y,
            translateX: -this._core.store.state.translateX,
            translateY: -this._core.store.state.translateY,
            scale: this._core.store.state.scale,
            stroke: this.color,
            strokeWidth: this.size,
            arrows: this.arrows,
          });
          updatedLine.id = currentLine.id;
          updatedLine.workspaceId = currentLine.workspaceId;
          updatedLine.isCompleted = false;

          this._core.store.state.objects.update(updatedLine);
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

        const currentLine = this._core.store.currentLine;
        if (currentLine) {
          currentLine.isCompleted = true;
          currentLine.zIndex = this._core.store.currentZIndex;
          this._core.store.state.objects.update(currentLine);
          this._core.engine.emitObjectsChange();

          // Switch to selection tool and select the drawn line
          this.selectLineAndSwitchTool(currentLine);
        }
      }
    }

    if (event.pointerType === 'touch') {
      if (this._core.store.state.isDrawing) {
        this._core.store.state.isDrawing = false;

        const currentLine = this._core.store.currentLine;
        if (currentLine) {
          currentLine.isCompleted = true;
          currentLine.zIndex = this._core.store.currentZIndex;
          this._core.store.state.objects.update(currentLine);
          this._core.engine.emitObjectsChange();

          // Switch to selection tool and select the drawn line
          this.selectLineAndSwitchTool(currentLine);
        }
      }
    }
  }

  private selectLineAndSwitchTool(line: KritzelLine): void {
    // Create a selection group with the drawn line
    const selectionGroup = KritzelSelectionGroup.create(this._core);
    selectionGroup.addOrRemove(line);
    selectionGroup.isSelected = true;
    selectionGroup.rotation = line.rotation;

    // Add the selection group
    this._core.addSelectionGroup(selectionGroup);

    // Switch to selection tool
    this._core.store.setState('activeTool', KritzelToolRegistry.getTool('selection'));

    // Rerender
    this._core.rerender();
  }
}
