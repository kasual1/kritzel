import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseHandler } from './base.handler';

export type LineHandleType = 'start' | 'end';

export class KritzelLineHandleHandler extends KritzelBaseHandler {
  initialMouseX = 0;
  initialMouseY = 0;

  initialStartX = 0;
  initialStartY = 0;
  initialEndX = 0;
  initialEndY = 0;
  initialTranslateX = 0;
  initialTranslateY = 0;

  hasMoved = false;

  constructor(core: KritzelCore) {
    super(core);
  }

  private reset(): void {
    this.initialMouseX = 0;
    this.initialMouseY = 0;
    this.initialStartX = 0;
    this.initialStartY = 0;
    this.initialEndX = 0;
    this.initialEndY = 0;
    this.initialTranslateX = 0;
    this.initialTranslateY = 0;
    this.hasMoved = false;
  }

  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this.startHandleDrag(event);
      }
    }

    if (event.pointerType === 'touch') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      if (activePointers.length === 1) {
        this.startHandleDrag(event);
      }
    }
  }

  private startHandleDrag(event: PointerEvent): void {
    const line = this.getSelectedLine();
    if (!line || !this._core.store.state.isLineHandleSelected) {
      return;
    }

    const clientX = event.clientX - this._core.store.offsetX;
    const clientY = event.clientY - this._core.store.offsetY;

    this._core.store.state.isLineHandleDragging = true;
    this.initialMouseX = clientX;
    this.initialMouseY = clientY;

    // Store initial line state
    this.initialStartX = line.startX;
    this.initialStartY = line.startY;
    this.initialEndX = line.endX;
    this.initialEndY = line.endY;
    this.initialTranslateX = line.translateX;
    this.initialTranslateY = line.translateY;

    clearTimeout(this._core.store.state.longTouchTimeout);
  }

  handlePointerMove(event: PointerEvent): void {
    const line = this.getSelectedLine();
    if (!line || !this._core.store.state.isLineHandleDragging) {
      return;
    }

    const clientX = event.clientX - this._core.store.offsetX;
    const clientY = event.clientY - this._core.store.offsetY;

    const dx = clientX - this.initialMouseX;
    const dy = clientY - this.initialMouseY;

    const moveThreshold = 3;
    if (Math.abs(dx) > moveThreshold || Math.abs(dy) > moveThreshold) {
      this.hasMoved = true;
    }

    if (!this.hasMoved) {
      return;
    }

    const viewportScale = this._core.store.state.scale;
    const objectScale = line.scale || 1;
    const rotation = line.rotation;

    // Convert mouse delta to world coordinates
    const worldDx = dx / viewportScale;
    const worldDy = dy / viewportScale;

    // Rotate the delta into the line's local coordinate system
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const localDx = (worldDx * cos - worldDy * sin) * objectScale;
    const localDy = (worldDx * sin + worldDy * cos) * objectScale;

    const handleType = this._core.store.state.lineHandleType;

    if (handleType === 'start') {
      // Update start point in local coordinates
      const newStartX = this.initialStartX + localDx;
      const newStartY = this.initialStartY + localDy;
      
      this.updateLineEndpoint(line, newStartX, newStartY, this.initialEndX, this.initialEndY);
    } else if (handleType === 'end') {
      // Update end point in local coordinates
      const newEndX = this.initialEndX + localDx;
      const newEndY = this.initialEndY + localDy;
      
      this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, newEndX, newEndY);
    }

    this._core.rerender();
  }

  private updateLineEndpoint(line: KritzelLine, startX: number, startY: number, endX: number, endY: number): void {
    // Calculate new bounding box
    const minX = Math.min(startX, endX) - line.strokeWidth / 2;
    const minY = Math.min(startY, endY) - line.strokeWidth / 2;
    const maxX = Math.max(startX, endX) + line.strokeWidth / 2;
    const maxY = Math.max(startY, endY) + line.strokeWidth / 2;

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    // Calculate old bounding box
    const oldMinX = Math.min(this.initialStartX, this.initialEndX) - line.strokeWidth / 2;
    const oldMinY = Math.min(this.initialStartY, this.initialEndY) - line.strokeWidth / 2;
    const oldMaxX = Math.max(this.initialStartX, this.initialEndX) + line.strokeWidth / 2;
    const oldMaxY = Math.max(this.initialStartY, this.initialEndY) + line.strokeWidth / 2;

    const oldWidth = oldMaxX - oldMinX;
    const oldHeight = oldMaxY - oldMinY;

    // Calculate center shift in local space
    const shiftX = minX - oldMinX;
    const shiftY = minY - oldMinY;

    const deltaCx = shiftX + (newWidth - oldWidth) / 2;
    const deltaCy = shiftY + (newHeight - oldHeight) / 2;

    // Convert the center shift to world coordinates
    const rotation = line.rotation;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const scale = 1 / line.scale;

    const rotatedDeltaCx = deltaCx * cos - deltaCy * sin;
    const rotatedDeltaCy = deltaCx * sin + deltaCy * cos;

    // Calculate new translate
    const newTranslateX = this.initialTranslateX + scale * (oldWidth - newWidth) / 2 + scale * rotatedDeltaCx;
    const newTranslateY = this.initialTranslateY + scale * (oldHeight - newHeight) / 2 + scale * rotatedDeltaCy;

    // Update the line properties
    line.startX = startX;
    line.startY = startY;
    line.endX = endX;
    line.endY = endY;
    line.x = minX;
    line.y = minY;
    line.width = newWidth;
    line.height = newHeight;

    // Adjust translateX/Y to compensate for the bounding box shift
    line.translateX = newTranslateX;
    line.translateY = newTranslateY;

    // Clear cached adjusted points
    (line as unknown as { _adjustedPoints: number[][] | null })._adjustedPoints = null;

    this._core.store.state.objects.update(line);
  }

  handlePointerUp(_event: PointerEvent): void {
    if (this._core.store.state.isLineHandleDragging) {
      const line = this.getSelectedLine();
      if (line && this.hasMoved) {
        // Refresh the selection group dimensions after line endpoint change
        const selectionGroup = this._core.store.selectionGroup;
        if (selectionGroup) {
          selectionGroup.refreshObjectDimensions();
          selectionGroup.update();
          this._core.engine.emitObjectsChange();
          this._core.store.state.hasObjectsChanged = true;
        }
      }

      this._core.store.state.isLineHandleDragging = false;
      this.reset();
    }
  }

  private getSelectedLine(): KritzelLine | null {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length !== 1) {
      return null;
    }

    const object = selectionGroup.objects[0];
    if (object instanceof KritzelLine) {
      return object;
    }

    return null;
  }
}
