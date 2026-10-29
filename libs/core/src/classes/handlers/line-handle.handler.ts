import { KritzelEventHelper } from '../../helpers/event.helper';

import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelBaseHandler } from './base.handler';
import { SnapTarget } from '../../interfaces/anchor.interface';
import { KritzelColorHelper } from '../../helpers/color.helper';

/** The type of line handle being manipulated: start point, end point, or center control point. */
export type LineHandleType = 'start' | 'end' | 'center';

/**
 * Handler for manipulating line object handles (endpoints and control points).
 * Manages dragging of line start/end points and curve control points,
 * including snap-to-object functionality for creating anchored connections.
 */
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

  /**
   * Creates a new instance of the line handle handler.
   * @param core - The KritzelCore instance providing access to the drawing engine and state management.
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Resets the handler's internal state to its initial values.
   * Called after a drag operation completes to prepare for the next interaction.
   * Clears all stored initial positions, movement flags, and snap candidates.
   */
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
    this._core.anchorManager.clearSnapPreviewCandidate();
  }

  /**
   * Handles pointer down events to initiate line handle dragging.
   * For mouse input, responds only to left clicks.
   * For touch/pen input, responds only when there's exactly one active pointer.
   * @param event - The pointer event containing position and input type information.
   */
  handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        this.startHandleDrag(event);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());
      if (activePointers.length === 1) {
        this.startHandleDrag(event);
      }
    }
  }

  /**
   * Initializes the drag operation for a line handle.
   * Stores the initial mouse position and line state (endpoints, control point, translation)
   * to enable delta calculations during movement. Also removes any existing anchor
   * for the endpoint being dragged to allow repositioning.
   * @param event - The pointer event that initiated the drag.
   */
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

    const timeout = this._core.store.state.longTouchTimeout;

    if (timeout) {
      globalThis.clearTimeout?.(timeout);
    }
  }

  /**
   * Handles pointer move events during a line handle drag operation.
   * Updates the appropriate line property based on the handle type being dragged:
   * - 'start': Updates the line's start point, checking for snap targets.
   * - 'end': Updates the line's end point, checking for snap targets.
   * - 'center': Updates the quadratic curve control point, with snap-to-straight behavior.
   *
   * Applies coordinate transformations to convert screen delta to the line's local coordinate system,
   * accounting for viewport scale, object scale, and rotation.
   *
   * @param event - The pointer event containing the current cursor position.
   */
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

      const previewTarget = this._core.anchorManager.findSnapPreviewTarget(worldX, worldY, line.id, otherAnchorId);

      // Check for snap target
      const snapTarget = this._core.anchorManager.findSnapTarget(worldX, worldY, line.id, otherAnchorId, event.pointerType);
      this.currentSnapTarget = snapTarget;

      const otherEndpointWorld = this.lineLocalToWorld(line, this.initialEndX, this.initialEndY);

      let controlWorld = undefined;
      if (line.controlX !== undefined && line.controlY !== undefined) {
        controlWorld = this.lineLocalToWorld(line, line.controlX, line.controlY);
      }

      if (snapTarget) {
        // Snap to target center - convert world coords to local
        const localCoords = this.worldToLineLocal(line, snapTarget.centerX, snapTarget.centerY);
        this.updateLineEndpoint(line, localCoords.x, localCoords.y, this.initialEndX, this.initialEndY);

        // Calculate edge intersection point using AnchorManager to support curves
        const targetObject = this._core.store.allNonSelectionObjects.find(obj => obj.id === snapTarget.objectId);
        let edgeX: number | undefined;
        let edgeY: number | undefined;
        let t: number | undefined;

        if (targetObject) {
          const clipInfo = this._core.anchorManager.computeAnchorClipInfo(line, 'start', targetObject);
          if (clipInfo) {
            edgeX = clipInfo.worldX;
            edgeY = clipInfo.worldY;
            t = clipInfo.t;
          }
        }

        // Update snap indicator
        this._core.anchorManager.setSnapPreviewCandidate(null);
        this._core.anchorManager.setSnapCandidate(this.createIndicatorCandidate(line, 'start', snapTarget, otherEndpointWorld, controlWorld, { edgeX, edgeY, t }));
      } else if (previewTarget) {
        const newStartX = this.initialStartX + localDx;
        const newStartY = this.initialStartY + localDy;
        this.updateLineEndpoint(line, newStartX, newStartY, this.initialEndX, this.initialEndY);

        this._core.anchorManager.clearSnapCandidate();
        this._core.anchorManager.setSnapPreviewCandidate(this.createIndicatorCandidate(line, 'start', previewTarget, otherEndpointWorld, controlWorld));
      } else {
        // No snap - use regular position
        const newStartX = this.initialStartX + localDx;
        const newStartY = this.initialStartY + localDy;
        this.updateLineEndpoint(line, newStartX, newStartY, this.initialEndX, this.initialEndY);

        // Clear snap indicator
        this._core.anchorManager.clearSnapCandidate();
        this._core.anchorManager.clearSnapPreviewCandidate();
      }
    } else if (handleType === 'end') {
      // Calculate world position directly from mouse position for snap detection
      const worldX = (clientX - this._core.store.state.translateX) / viewportScale;
      const worldY = (clientY - this._core.store.state.translateY) / viewportScale;

      // Get other endpoint's anchor to prevent anchoring both to same object
      const otherAnchorId = line.startAnchor?.objectId;

      const previewTarget = this._core.anchorManager.findSnapPreviewTarget(worldX, worldY, line.id, otherAnchorId);

      // Check for snap target
      const snapTarget = this._core.anchorManager.findSnapTarget(worldX, worldY, line.id, otherAnchorId, event.pointerType);
      this.currentSnapTarget = snapTarget;

      const otherEndpointWorld = this.lineLocalToWorld(line, this.initialStartX, this.initialStartY);

      let controlWorld = undefined;
      if (line.controlX !== undefined && line.controlY !== undefined) {
        controlWorld = this.lineLocalToWorld(line, line.controlX, line.controlY);
      }

      if (snapTarget) {
        // Snap to target center - convert world coords to local
        const localCoords = this.worldToLineLocal(line, snapTarget.centerX, snapTarget.centerY);
        this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, localCoords.x, localCoords.y);

        // Calculate edge intersection point using AnchorManager to support curves
        const targetObject = this._core.store.allNonSelectionObjects.find(obj => obj.id === snapTarget.objectId);
        let edgeX: number | undefined;
        let edgeY: number | undefined;
        let t: number | undefined;

        if (targetObject) {
          const clipInfo = this._core.anchorManager.computeAnchorClipInfo(line, 'end', targetObject);
          if (clipInfo) {
            edgeX = clipInfo.worldX;
            edgeY = clipInfo.worldY;
            t = clipInfo.t;
          }
        }

        // Update snap indicator
        this._core.anchorManager.setSnapPreviewCandidate(null);
        this._core.anchorManager.setSnapCandidate(this.createIndicatorCandidate(line, 'end', snapTarget, otherEndpointWorld, controlWorld, { edgeX, edgeY, t }));
      } else if (previewTarget) {
        const newEndX = this.initialEndX + localDx;
        const newEndY = this.initialEndY + localDy;
        this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, newEndX, newEndY);

        this._core.anchorManager.clearSnapCandidate();
        this._core.anchorManager.setSnapPreviewCandidate(this.createIndicatorCandidate(line, 'end', previewTarget, otherEndpointWorld, controlWorld));
      } else {
        // No snap - use regular position
        const newEndX = this.initialEndX + localDx;
        const newEndY = this.initialEndY + localDy;
        this.updateLineEndpoint(line, this.initialStartX, this.initialStartY, newEndX, newEndY);

        // Clear snap indicator
        this._core.anchorManager.clearSnapCandidate();
        this._core.anchorManager.clearSnapPreviewCandidate();
      }
    } else if (handleType === 'center') {
      this._core.anchorManager.clearSnapPreviewCandidate();
      this._core.anchorManager.clearSnapCandidate();
      const startControlX = this.initialControlX ?? (this.initialStartX + this.initialEndX) / 2;
      const startControlY = this.initialControlY ?? (this.initialStartY + this.initialEndY) / 2;
      const newControlX = startControlX + localDx * 2;
      const newControlY = startControlY + localDy * 2;

      // Check distance to line segment for snapping back to straight
      const x1 = line.startX;
      const y1 = line.startY;
      const x2 = line.endX;
      const y2 = line.endY;

      const A = newControlX - x1;
      const B = newControlY - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      let param = -1;

      if (len_sq !== 0) {
        param = dot / len_sq;
      }

      let xx, yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = newControlX - xx;
      const dy = newControlY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Threshold for snapping back to straight line
      const snapToStraightThreshold = 15;

      if (distance < snapToStraightThreshold) {
        line.updateControlPoint(undefined, undefined);
      } else {
        line.updateControlPoint(newControlX, newControlY);
      }
    }

    this._core.rerender();
  }

  /**
   * Converts world coordinates to a line's local coordinate system.
   * Accounts for the line's translation, scale, and rotation to transform
   * absolute canvas positions into the line's internal coordinate space.
   *
   * @param line - The line object whose coordinate system to transform into.
   * @param worldX - The X coordinate in world/canvas space.
   * @param worldY - The Y coordinate in world/canvas space.
   * @returns An object containing the transformed local X and Y coordinates.
   */
  private worldToLineLocal(line: KritzelLine, worldX: number, worldY: number): { x: number; y: number } {
    const dx = (worldX - line.translateX) * line.scale;
    const dy = (worldY - line.translateY) * line.scale;

    const cx = line.totalWidth / 2;
    const cy = line.totalHeight / 2;

    const cos = Math.cos(-line.rotation);
    const sin = Math.sin(-line.rotation);

    const rotatedX = (dx - cx) * cos - (dy - cy) * sin + cx;
    const rotatedY = (dx - cx) * sin + (dy - cy) * cos + cy;

    return {
      x: rotatedX + line.x,
      y: rotatedY + line.y,
    };
  }

  /**
   * Converts a line's local coordinate system to world coordinates.
   * Reverses the transformations applied by worldToLineLocal to convert
   * the line's internal coordinates back to absolute canvas positions.
   *
   * @param line - The line object whose coordinate system to transform from.
   * @param localX - The X coordinate in the line's local space.
   * @param localY - The Y coordinate in the line's local space.
   * @returns An object containing the transformed world X and Y coordinates.
   */
  private lineLocalToWorld(line: KritzelLine, localX: number, localY: number): { x: number; y: number } {
    const px = localX - line.x;
    const py = localY - line.y;

    const cx = line.totalWidth / 2;
    const cy = line.totalHeight / 2;

    const cos = Math.cos(line.rotation);
    const sin = Math.sin(line.rotation);

    const rotatedX = (px - cx) * cos - (py - cy) * sin + cx;
    const rotatedY = (px - cx) * sin + (py - cy) * cos + cy;

    return {
      x: rotatedX / line.scale + line.translateX,
      y: rotatedY / line.scale + line.translateY,
    };
  }

  /**
   * Updates a line's endpoint positions and recalculates all dependent properties.
   * Computes new bounding boxes for both the old and new line configurations,
   * adjusts the line's position (x, y), dimensions (width, height), and translation
   * to maintain visual consistency while moving endpoints.
   *
   * @param line - The line object to update.
   * @param startX - The new X coordinate for the line's start point in local space.
   * @param startY - The new Y coordinate for the line's start point in local space.
   * @param endX - The new X coordinate for the line's end point in local space.
   * @param endY - The new Y coordinate for the line's end point in local space.
   */
  private updateLineEndpoint(line: KritzelLine, startX: number, startY: number, endX: number, endY: number): void {
    // Calculate new bounding box using the static method that accounts for curve extrema
    const { minX, minY, maxX, maxY } = KritzelLine.calculateBoundingBox(startX, startY, endX, endY, line.controlX, line.controlY, line.strokeWidth);

    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    // Calculate old bounding box
    const {
      minX: oldMinX,
      minY: oldMinY,
      maxX: oldMaxX,
      maxY: oldMaxY,
    } = KritzelLine.calculateBoundingBox(this.initialStartX, this.initialStartY, this.initialEndX, this.initialEndY, this.initialControlX, this.initialControlY, line.strokeWidth);

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
    const newTranslateX = this.initialTranslateX + (scale * (oldWidth - newWidth)) / 2 + scale * rotatedDeltaCx;
    const newTranslateY = this.initialTranslateY + (scale * (oldHeight - newHeight)) / 2 + scale * rotatedDeltaCy;

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

    // Clear transient caches so geometry and anchor clipping recompute on demand.
    const linePrivate = line as unknown as {
      _adjustedPoints: number[][] | null;
      _clipInfo: { start?: { x: number; y: number; t?: number }; end?: { x: number; y: number; t?: number } } | null;
    };
    linePrivate._adjustedPoints = null;
    linePrivate._clipInfo = null;

    this._core.store.objects.update(line);
  }

  /**
   * Handles pointer up events to complete a line handle drag operation.
   * If the line was moved and snapped to a target object, creates an anchor connection.
   * Refreshes the selection group dimensions and triggers change events.
   * Finally resets the handler state and triggers a rerender.
   *
   * @param _event - The pointer event (unused, but required by the handler interface).
   */
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
        this._core.store.objects.stopUndoCapturing();
      }

      this._core.store.state.isLineHandleDragging = false;
      this.reset();
      this._core.rerender();
    }
  }

  /**
   * Retrieves the currently selected line object, if any.
   * Returns the line only when exactly one object is selected and it is a KritzelLine instance.
   *
   * @returns The selected KritzelLine object, or null if no single line is selected.
   */
  private getSelectedLine(): KritzelLine | null {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length !== 1) {
      return null;
    }

    const object = selectionGroup.objects[0];
    if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
      return object;
    }

    return null;
  }

  private createIndicatorCandidate(
    line: KritzelLine,
    endpoint: 'start' | 'end',
    target: SnapTarget,
    otherEndpointWorld: { x: number; y: number },
    controlWorld?: { x: number; y: number },
    clipInfo?: { edgeX?: number; edgeY?: number; t?: number }
  ) {
    return {
      objectId: target.objectId,
      endpoint,
      centerX: target.centerX,
      centerY: target.centerY,
      lineEndpointX: otherEndpointWorld.x,
      lineEndpointY: otherEndpointWorld.y,
      controlX: controlWorld?.x,
      controlY: controlWorld?.y,
      t: clipInfo?.t,
      edgeX: clipInfo?.edgeX,
      edgeY: clipInfo?.edgeY,
      lineStroke: KritzelColorHelper.resolveThemeColor(line.stroke, this._core.themeManager.currentTheme),
      lineStrokeWidth: line.strokeWidth / line.scale,
      arrowOffset:
        endpoint === 'start'
          ? (line.hasStartArrow ? line.getArrowSize('start') / line.scale : undefined)
          : (line.hasEndArrow ? line.getArrowSize('end') / line.scale : undefined),
      arrowStyle: endpoint === 'start' ? line.arrows?.start?.style : line.arrows?.end?.style,
      arrowFill: endpoint === 'start' ? line.getArrowFill('start') : line.getArrowFill('end'),
    };
  }
}
