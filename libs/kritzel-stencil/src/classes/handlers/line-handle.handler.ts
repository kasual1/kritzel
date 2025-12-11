import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseHandler } from './base.handler';
import { SnapTarget } from '../../interfaces/anchor.interface';

export type LineHandleType = 'start' | 'end' | 'center';

export class KritzelLineHandleHandler extends KritzelBaseHandler {
  initialMouseX = 0;
  initialMouseY = 0;

  initialStartX = 0;
  initialStartY = 0;
  initialEndX = 0;
  initialEndY = 0;
  initialControlX: number | undefined;
  initialControlY: number | undefined;
  initialTranslateX = 0;
  initialTranslateY = 0;

  hasMoved = false;

  /** Current snap target during drag, if any */
  private currentSnapTarget: SnapTarget | null = null;

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
    this.initialControlX = undefined;
    this.initialControlY = undefined;
    this.initialTranslateX = 0;
    this.initialTranslateY = 0;
    this.hasMoved = false;
    this.currentSnapTarget = null;
    this._core.anchorManager.clearSnapCandidate();
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
    this.initialControlX = line.controlX;
    this.initialControlY = line.controlY;
    this.initialTranslateX = line.translateX;
    this.initialTranslateY = line.translateY;

    // Remove existing anchor for this endpoint when starting to drag
    const handleType = this._core.store.state.lineHandleType;
    if (handleType === 'start' || handleType === 'end') {
      this._core.anchorManager.removeAnchor(line.id, handleType);
    }

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
      // Calculate world position directly from mouse position for snap detection
      const worldX = (clientX - this._core.store.state.translateX) / viewportScale;
      const worldY = (clientY - this._core.store.state.translateY) / viewportScale;

      // Get other endpoint's anchor to prevent anchoring both to same object
      const otherAnchorId = line.endAnchor?.objectId;

      // Check for snap target
      const snapTarget = this._core.anchorManager.findSnapTarget(worldX, worldY, line.id, otherAnchorId);
      this.currentSnapTarget = snapTarget;

      if (snapTarget) {
        // Snap to target center - convert world coords to local
        const localCoords = this.worldToLineLocal(line, snapTarget.centerX, snapTarget.centerY);
        this.updateLineEndpoint(line, localCoords.x, localCoords.y, this.initialEndX, this.initialEndY);

        // Get the other endpoint's world position for edge intersection calculation
        const otherEndpointWorld = this.lineLocalToWorld(line, this.initialEndX, this.initialEndY);
        
        // Calculate edge intersection point
        const targetObject = this._core.store.allNonSelectionObjects.find(obj => obj.id === snapTarget.objectId);
        let edgeX: number | undefined;
        let edgeY: number | undefined;
        if (targetObject) {
          const edgeIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
            { x: otherEndpointWorld.x, y: otherEndpointWorld.y },
            { x: snapTarget.centerX, y: snapTarget.centerY },
            targetObject.rotatedPolygon
          );
          if (edgeIntersection) {
            edgeX = edgeIntersection.x;
            edgeY = edgeIntersection.y;
          }
        }

        // Update snap indicator
        this._core.anchorManager.setSnapCandidate({
          objectId: snapTarget.objectId,
          endpoint: 'start',
          centerX: snapTarget.centerX,
          centerY: snapTarget.centerY,
          lineEndpointX: otherEndpointWorld.x,
          lineEndpointY: otherEndpointWorld.y,
          edgeX,
          edgeY,
          lineStroke: line.stroke,
          lineStrokeWidth: line.strokeWidth / line.scale,
        });
      } else {
        // No snap - use regular position
        const newStartX = this.initialStartX + localDx;
        const newStartY = this.initialStartY + localDy;
        this.updateLineEndpoint(line, newStartX, newStartY, this.initialEndX, this.initialEndY);

        // Clear snap indicator
        this._core.anchorManager.clearSnapCandidate();
      }
    } else if (handleType === 'end') {
      // Calculate world position directly from mouse position for snap detection
      const worldX = (clientX - this._core.store.state.translateX) / viewportScale;
      const worldY = (clientY - this._core.store.state.translateY) / viewportScale;

      // Get other endpoint's anchor to prevent anchoring both to same object
      const otherAnchorId = line.startAnchor?.objectId;

      // Check for snap target
      const snapTarget = this._core.anchorManager.findSnapTarget(worldX, worldY, line.id, otherAnchorId);
      this.currentSnapTarget = snapTarget;

      if (snapTarget) {
        // Snap to target center - convert world coords to local
        const localCoords = this.worldToLineLocal(line, snapTarget.centerX, snapTarget.centerY);
        this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, localCoords.x, localCoords.y);

        // Get the other endpoint's world position for edge intersection calculation
        const otherEndpointWorld = this.lineLocalToWorld(line, this.initialStartX, this.initialStartY);
        
        // Calculate edge intersection point
        const targetObject = this._core.store.allNonSelectionObjects.find(obj => obj.id === snapTarget.objectId);
        let edgeX: number | undefined;
        let edgeY: number | undefined;
        if (targetObject) {
          const edgeIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
            { x: otherEndpointWorld.x, y: otherEndpointWorld.y },
            { x: snapTarget.centerX, y: snapTarget.centerY },
            targetObject.rotatedPolygon
          );
          if (edgeIntersection) {
            edgeX = edgeIntersection.x;
            edgeY = edgeIntersection.y;
          }
        }

        // Update snap indicator
        this._core.anchorManager.setSnapCandidate({
          objectId: snapTarget.objectId,
          endpoint: 'end',
          centerX: snapTarget.centerX,
          centerY: snapTarget.centerY,
          lineEndpointX: otherEndpointWorld.x,
          lineEndpointY: otherEndpointWorld.y,
          edgeX,
          edgeY,
          lineStroke: line.stroke,
          lineStrokeWidth: line.strokeWidth / line.scale,
        });
      } else {
        // No snap - use regular position
        const newEndX = this.initialEndX + localDx;
        const newEndY = this.initialEndY + localDy;
        this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, newEndX, newEndY);

        // Clear snap indicator
        this._core.anchorManager.clearSnapCandidate();
      }
    } else if (handleType === 'center') {
      const startControlX = this.initialControlX ?? (this.initialStartX + this.initialEndX) / 2;
      const startControlY = this.initialControlY ?? (this.initialStartY + this.initialEndY) / 2;
      const newControlX = startControlX + localDx * 2;
      const newControlY = startControlY + localDy * 2;
      line.updateControlPoint(newControlX, newControlY);
    }

    this._core.rerender();
  }

  /**
   * Converts world coordinates to a line's local coordinate system.
   */
  private worldToLineLocal(line: KritzelLine, worldX: number, worldY: number): { x: number; y: number } {
    // Translate to line's origin
    const dx = worldX - line.translateX;
    const dy = worldY - line.translateY;

    // Apply inverse rotation
    const cos = Math.cos(-line.rotation);
    const sin = Math.sin(-line.rotation);
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Apply scale and add origin offset
    const localX = rotatedX * line.scale + line.x;
    const localY = rotatedY * line.scale + line.y;

    return { x: localX, y: localY };
  }

  /**
   * Converts a line's local coordinate system to world coordinates.
   */
  private lineLocalToWorld(line: KritzelLine, localX: number, localY: number): { x: number; y: number } {
    // Remove origin offset and scale
    const scaledX = (localX - line.x) / line.scale;
    const scaledY = (localY - line.y) / line.scale;

    // Apply rotation
    const cos = Math.cos(line.rotation);
    const sin = Math.sin(line.rotation);
    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;

    // Translate from line's origin
    const worldX = rotatedX + line.translateX;
    const worldY = rotatedY + line.translateY;

    return { x: worldX, y: worldY };
  }

  private updateLineEndpoint(line: KritzelLine, startX: number, startY: number, endX: number, endY: number): void {
    // Calculate new bounding box using the static method that accounts for curve extrema
    const { minX, minY, maxX, maxY } = KritzelLine.calculateBoundingBox(
      startX,
      startY,
      endX,
      endY,
      line.controlX,
      line.controlY,
      line.strokeWidth,
    );

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    // Calculate old bounding box
    const {
      minX: oldMinX,
      minY: oldMinY,
      maxX: oldMaxX,
      maxY: oldMaxY,
    } = KritzelLine.calculateBoundingBox(
      this.initialStartX,
      this.initialStartY,
      this.initialEndX,
      this.initialEndY,
      this.initialControlX,
      this.initialControlY,
      line.strokeWidth,
    );

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
      const handleType = this._core.store.state.lineHandleType;

      if (line && this.hasMoved) {
        // If we were snapped to a target, create the anchor
        if (this.currentSnapTarget && (handleType === 'start' || handleType === 'end')) {
          this._core.anchorManager.setAnchor(line.id, handleType, this.currentSnapTarget.objectId);
        }

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
      this._core.rerender();
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
