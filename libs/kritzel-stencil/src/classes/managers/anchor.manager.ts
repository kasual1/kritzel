import { AnchorIndexEntry, AnchorLinesRenderData, AnchorVisualization, LineAnchor, SnapCandidate, SnapIndicatorRenderData, SnapTarget } from '../../interfaces/anchor.interface';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelPoint } from '../../interfaces/point.interface';
import { KritzelPolygon } from '../../interfaces/polygon.interface';

type AnchorClipInfo = {
  localX: number;
  localY: number;
  worldX: number;
  worldY: number;
  t?: number;
};

type QuadraticPoint = { x: number; y: number };

type QuadraticSegment = {
  start: QuadraticPoint;
  control: QuadraticPoint;
  end: QuadraticPoint;
};

/**
 * Manages anchor connections between line endpoints and other objects.
 * Maintains a runtime index for efficient reverse lookups and handles
 * snap detection during line endpoint dragging.
 */
export class KritzelAnchorManager {
  private readonly _core: KritzelCore;

  /**
   * Runtime index mapping objectId to the lines anchored to it.
   * This is derived from the anchor properties on lines and rebuilt as needed.
   */
  private readonly _anchorIndex: Map<string, Set<AnchorIndexEntry>> = new Map();

  constructor(core: KritzelCore) {
    this._core = core;
  }

  // ============================================
  // Anchor CRUD Operations
  // ============================================

  /**
   * Sets an anchor from a line endpoint to a target object's center.
   * Updates both the line's anchor property and the internal index.
   */
  setAnchor(lineId: string, endpoint: 'start' | 'end', targetObjectId: string): void {
    const line = this.getLineById(lineId);
    if (!line) {
      return;
    }

    // Prevent anchoring both endpoints to the same object
    if (endpoint === 'start' && line.endAnchor?.objectId === targetObjectId) {
      return;
    }
    if (endpoint === 'end' && line.startAnchor?.objectId === targetObjectId) {
      return;
    }

    // Remove existing anchor if any
    this.removeAnchor(lineId, endpoint);

    // Set the anchor on the line
    const anchor: LineAnchor = { objectId: targetObjectId };
    if (endpoint === 'start') {
      line.startAnchor = anchor;
    } else {
      line.endAnchor = anchor;
    }

    // Update the index
    this.addToIndex(targetObjectId, lineId, endpoint);

    // Snap the endpoint to the target's center
    this.snapEndpointToObject(line, endpoint, targetObjectId);

    // Persist the change
    this._core.store.state.objects.update(line);
  }

  /**
   * Removes an anchor from a line endpoint.
   * Updates both the line's anchor property and the internal index.
   */
  removeAnchor(lineId: string, endpoint: 'start' | 'end'): void {
    const line = this.getLineById(lineId);
    if (!line) {
      return;
    }

    const anchor = endpoint === 'start' ? line.startAnchor : line.endAnchor;
    if (!anchor) {
      return;
    }

    // Remove from index
    this.removeFromIndex(anchor.objectId, lineId, endpoint);

    // Clear the anchor on the line
    if (endpoint === 'start') {
      line.startAnchor = undefined;
    } else {
      line.endAnchor = undefined;
    }
  }

  /**
   * Gets the anchor for a specific line endpoint.
   */
  getAnchor(lineId: string, endpoint: 'start' | 'end'): LineAnchor | null {
    const line = this.getLineById(lineId);
    if (!line) {
      return null;
    }

    const anchor = endpoint === 'start' ? line.startAnchor : line.endAnchor;
    return anchor ?? null;
  }

  // ============================================
  // Query Operations
  // ============================================

  /**
   * Gets all lines that have an endpoint anchored to the specified object.
   */
  getLinesAnchoredTo(objectId: string): AnchorIndexEntry[] {
    const entries = this._anchorIndex.get(objectId);
    return entries ? Array.from(entries) : [];
  }

  // ============================================
  // Position Updates
  // ============================================

  /**
   * Updates all line endpoints that are anchored to the specified object.
   * Should be called when an object moves.
   */
  updateAnchorsForObject(objectId: string): void {
    const entries = this.getLinesAnchoredTo(objectId);
    if (entries.length === 0) {
      return;
    }

    const targetObject = this.getObjectById(objectId);
    if (!targetObject) {
      return;
    }

    for (const entry of entries) {
      const line = this.getLineById(entry.lineId);
      if (!line) {
        continue;
      }

      this.snapEndpointToObject(line, entry.endpoint, objectId);
    }
  }

  /**
   * Snaps a line endpoint to an object's center.
   */
  private snapEndpointToObject(line: KritzelLine, endpoint: 'start' | 'end', targetObjectId: string): void {
    const targetObject = this.getObjectById(targetObjectId);
    if (!targetObject) {
      return;
    }

    // Get target center in world coordinates
    const targetCenterX = targetObject.centerX;
    const targetCenterY = targetObject.centerY;

    // Convert world coordinates to line's local coordinate system
    const localCoords = this.worldToLineLocal(line, targetCenterX, targetCenterY);

    // Update the endpoint
    line.updateEndpoint(endpoint, localCoords.x, localCoords.y);
  }

  /**
   * Converts world coordinates to a line's local coordinate system.
   */
  private worldToLineLocal(line: KritzelLine, worldX: number, worldY: number): { x: number; y: number } {
    // Get line center in world coordinates
    const cx = line.centerX;
    const cy = line.centerY;

    // Translate to center
    const dx = worldX - cx;
    const dy = worldY - cy;

    // Apply inverse rotation
    const cos = Math.cos(-line.rotation);
    const sin = Math.sin(-line.rotation);
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    // Calculate local coordinates relative to the unrotated bounding box top-left
    const relativeX = rotatedX + (line.totalWidth / 2) / line.scale;
    const relativeY = rotatedY + (line.totalHeight / 2) / line.scale;

    // Convert to internal coordinates
    const localX = relativeX * line.scale + line.x;
    const localY = relativeY * line.scale + line.y;

    return { x: localX, y: localY };
  }

  // ============================================
  // Snap Detection
  // ============================================

  /**
   * Finds the nearest object that can be snapped to within the snap threshold.
   * Returns null if no suitable snap target is found.
   *
   * @param worldX - X coordinate in world space
   * @param worldY - Y coordinate in world space
   * @param excludeLineId - ID of the line being edited (to exclude from snap targets)
   * @param otherEndpointAnchorId - ID of object anchored to the other endpoint (to prevent same-object anchoring)
   */
  findSnapTarget(
    worldX: number,
    worldY: number,
    excludeLineId: string,
    otherEndpointAnchorId?: string
  ): SnapTarget | null {
    let bestTarget: SnapTarget | null = null;
    let highestZIndex = -Infinity;

    const objects = this._core.store.allNonSelectionObjects;

    for (const object of objects) {
      // Skip the line being edited
      if (object.id === excludeLineId) {
        continue;
      }

      // Skip if this is the object anchored to the other endpoint
      if (otherEndpointAnchorId && object.id === otherEndpointAnchorId) {
        continue;
      }

      // Skip non-anchorable objects
      if (!this.isAnchorable(object)) {
        continue;
      }

      // Check if point is inside the object's rotated polygon
      const polygon = object.rotatedPolygon;
      const points = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];

      if (KritzelGeometryHelper.isPointInPolygon({ x: worldX, y: worldY }, points)) {
        // If inside, check if this object is "above" the current best target
        if (object.zIndex > highestZIndex) {
          highestZIndex = object.zIndex;
          bestTarget = {
            objectId: object.id,
            centerX: object.centerX,
            centerY: object.centerY,
          };
        }
      }
    }

    return bestTarget;
  }

  /**
   * Sets the current snap candidate for visual feedback.
   */
  setSnapCandidate(candidate: SnapCandidate | null): void {
    this._core.store.state.snapCandidate = candidate;
    this._core.rerender();
  }

  /**
   * Gets the current snap candidate.
   */
  getSnapCandidate(): SnapCandidate | null {
    return this._core.store.state.snapCandidate ?? null;
  }

  /**
   * Clears the snap candidate.
   */
  clearSnapCandidate(): void {
    this._core.store.state.snapCandidate = null;
    this._core.rerender();
  }

  // ============================================
  // Render Data
  // ============================================

  /**
   * Gets render data for anchor lines visualization.
   * Returns null if there's no selected line with anchors or if snap is in progress.
   */
  getAnchorLinesRenderData(): AnchorLinesRenderData | null {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length !== 1) return null;

    const selectedObject = selectionGroup.objects[0];
    if (!KritzelClassHelper.isInstanceOf<KritzelLine>(selectedObject, 'KritzelLine')) return null;

    const line = selectedObject as KritzelLine;



    const startAnchorViz = this.computeAnchorVisualization(line, 'start');
    const endAnchorViz = this.computeAnchorVisualization(line, 'end');

    if (!startAnchorViz && !endAnchorViz) return null;

    const scale = this._core.store.state.scale;
    const lineStrokeWidth = line.strokeWidth / line.scale;
    const indicatorStrokeWidth = `${2 / scale}`;
    const dashLength = Math.max(lineStrokeWidth * 2, 4 / scale);
    const dashArray = `${dashLength} ${dashLength}`;
    const indicatorRadius = 8 / scale;

    return {
      lineStrokeWidth,
      indicatorStrokeWidth,
      dashArray,
      indicatorRadius,
      startAnchorViz,
      endAnchorViz,
    };
  }

  /**
   * Gets render data for snap indicator visualization.
   * Returns null if there's no snap candidate.
   */
  getSnapIndicatorRenderData(): SnapIndicatorRenderData | null {
    const snapCandidate = this.getSnapCandidate();
    if (!snapCandidate) return null;

    const scale = this._core.store.state.scale;
    const indicatorRadius = 8 / scale;
    const indicatorStrokeWidth = `${2 / scale}`;
    const lineStrokeWidth = snapCandidate.lineStrokeWidth
      ? `${snapCandidate.lineStrokeWidth}`
      : `${4 / scale}`;
    const lineStrokeWidthNum = snapCandidate.lineStrokeWidth || (4 / scale);
    const dashLength = Math.max(lineStrokeWidthNum * 2, 4 / scale);
    const dashArray = `${dashLength} ${dashLength}`;
    const lineStroke = snapCandidate.lineStroke || '#000000';

    let solidLineEndX = snapCandidate.edgeX;
    let solidLineEndY = snapCandidate.edgeY;
    let arrowPoints: string | undefined;

    if (snapCandidate.arrowOffset && snapCandidate.edgeX !== undefined && snapCandidate.edgeY !== undefined) {
      const dx = snapCandidate.lineEndpointX - snapCandidate.edgeX;
      const dy = snapCandidate.lineEndpointY - snapCandidate.edgeY;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > snapCandidate.arrowOffset) {
        solidLineEndX = snapCandidate.edgeX + (dx / length) * snapCandidate.arrowOffset;
        solidLineEndY = snapCandidate.edgeY + (dy / length) * snapCandidate.arrowOffset;
      }

      // Calculate arrow head points
      // Direction from line endpoint to edge (arrow direction)
      const arrowDx = snapCandidate.edgeX - snapCandidate.lineEndpointX;
      const arrowDy = snapCandidate.edgeY - snapCandidate.lineEndpointY;
      const arrowLengthTotal = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

      if (arrowLengthTotal > 0) {
        const ux = arrowDx / arrowLengthTotal;
        const uy = arrowDy / arrowLengthTotal;
        // Perpendicular vector
        const px = -uy;
        const py = ux;

        // Arrow dimensions
        const arrowLength = snapCandidate.arrowOffset;
        const arrowWidth = arrowLength; // 1:1 ratio

        // Arrow tip at edge
        const tipX = snapCandidate.edgeX;
        const tipY = snapCandidate.edgeY;

        // Arrow base
        const baseX = tipX - ux * arrowLength;
        const baseY = tipY - uy * arrowLength;

        // Arrow wings
        const leftX = baseX + px * arrowWidth / 2;
        const leftY = baseY + py * arrowWidth / 2;
        const rightX = baseX - px * arrowWidth / 2;
        const rightY = baseY - py * arrowWidth / 2;

        arrowPoints = `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
      }
    }
    return {
      indicatorRadius,
      indicatorStrokeWidth,
      lineStrokeWidth,
      dashArray,
      lineStroke,
      centerX: snapCandidate.centerX,
      centerY: snapCandidate.centerY,
      lineEndpointX: snapCandidate.lineEndpointX,
      lineEndpointY: snapCandidate.lineEndpointY,
      edgeX: snapCandidate.edgeX,
      edgeY: snapCandidate.edgeY,
      arrowOffset: snapCandidate.arrowOffset,
      arrowStyle: snapCandidate.arrowStyle,
      arrowFill: snapCandidate.arrowFill,
      solidLineEndX,
      solidLineEndY,
      arrowPoints,
      snapLinePath: (() => {
        if (
          snapCandidate.controlX !== undefined &&
          snapCandidate.controlY !== undefined &&
          snapCandidate.t !== undefined
        ) {
          const startT = snapCandidate.endpoint === 'start' ? 1 - snapCandidate.t : snapCandidate.t;

          // Ensure meaningful range
          if (startT >= 1) return undefined;

          const segment = this.extractQuadraticSegment(
            { x: snapCandidate.lineEndpointX, y: snapCandidate.lineEndpointY },
            { x: snapCandidate.controlX, y: snapCandidate.controlY },
            { x: snapCandidate.centerX, y: snapCandidate.centerY },
            startT,
            1
          );
          return `M ${segment.start.x} ${segment.start.y} Q ${segment.control.x} ${segment.control.y} ${segment.end.x} ${segment.end.y}`;
        }
        return undefined;
      })(),
    };
  }

  // ============================================
  // Cleanup Operations
  // ============================================

  /**
   * Handles cleanup when an object is deleted.
   * Detaches all lines that were anchored to the deleted object.
   */
  handleObjectDeleted(objectId: string): void {
    const entries = this.getLinesAnchoredTo(objectId);

    for (const entry of entries) {
      this.removeAnchor(entry.lineId, entry.endpoint);

      // Update the line to persist the change
      const line = this.getLineById(entry.lineId);
      if (line) {
        this._core.store.state.objects.update(line);
      }
    }

    // Remove the object from the index
    this._anchorIndex.delete(objectId);
  }

  /**
   * Handles cleanup when a line is deleted.
   * Removes all anchor index entries for the line.
   */
  handleLineDeleted(lineId: string): void {
    const line = this.getLineById(lineId);
    if (!line) {
      return;
    }

    if (line.startAnchor) {
      this.removeFromIndex(line.startAnchor.objectId, lineId, 'start');
    }
    if (line.endAnchor) {
      this.removeFromIndex(line.endAnchor.objectId, lineId, 'end');
    }
  }

  // ============================================
  // Index Management
  // ============================================

  /**
   * Rebuilds the anchor index from all lines in the object map.
   * Should be called after loading/deserializing objects.
   */
  rebuildIndex(): void {
    this._anchorIndex.clear();

    const objects = this._core.store.allObjects;

    for (const object of objects) {
      if (object instanceof KritzelLine) {
        if (object.startAnchor) {
          this.addToIndex(object.startAnchor.objectId, object.id, 'start');
        }
        if (object.endAnchor) {
          this.addToIndex(object.endAnchor.objectId, object.id, 'end');
        }
      }
    }
  }

  /**
   * Adds an entry to the anchor index.
   */
  private addToIndex(objectId: string, lineId: string, endpoint: 'start' | 'end'): void {
    if (!this._anchorIndex.has(objectId)) {
      this._anchorIndex.set(objectId, new Set());
    }

    const entries = this._anchorIndex.get(objectId)!;

    // Check if entry already exists
    for (const entry of entries) {
      if (entry.lineId === lineId && entry.endpoint === endpoint) {
        return;
      }
    }

    entries.add({ lineId, endpoint });
  }

  /**
   * Removes an entry from the anchor index.
   */
  private removeFromIndex(objectId: string, lineId: string, endpoint: 'start' | 'end'): void {
    const entries = this._anchorIndex.get(objectId);
    if (!entries) {
      return;
    }

    for (const entry of entries) {
      if (entry.lineId === lineId && entry.endpoint === endpoint) {
        entries.delete(entry);
        break;
      }
    }

    // Clean up empty sets
    if (entries.size === 0) {
      this._anchorIndex.delete(objectId);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Gets a line by its ID.
   */
  private getLineById(lineId: string): KritzelLine | null {
    const objects = this._core.store.state.objects.filter(o => o.id === lineId);
    if (objects.length === 0) {
      return null;
    }
    const object = objects[0];
    return object instanceof KritzelLine ? object : null;
  }

  /**
   * Gets an object by its ID.
   */
  private getObjectById(objectId: string): KritzelBaseObject<Element> | null {
    const objects = this._core.store.state.objects.filter(o => o.id === objectId);
    return objects.length > 0 ? objects[0] : null;
  }

  private findAnchorTarget(line: KritzelLine, endpoint: 'start' | 'end'): KritzelBaseObject<Element> | null {
    const anchor = endpoint === 'start' ? line.startAnchor : line.endAnchor;
    if (!anchor) {
      return null;
    }
    return this._core.store.allNonSelectionObjects.find(obj => obj.id === anchor.objectId) ?? null;
  }

  // ============================================
  // Visualization Helpers
  // ============================================

  /**
   * Computes anchor visualization data for a line with anchors.
   * Returns edge intersection points for rendering dashed lines from edge to center.
   */
  computeAnchorVisualization(line: KritzelLine, endpoint: 'start' | 'end'): AnchorVisualization | null {
    const anchor = endpoint === 'start' ? line.startAnchor : line.endAnchor;
    if (!anchor) return null;

    const targetObject = this.findAnchorTarget(line, endpoint);
    if (!targetObject) return null;

    const clipInfo = this.computeAnchorClipInfo(line, endpoint, targetObject);
    if (!clipInfo) return null;

    const centerX = targetObject.centerX;
    const centerY = targetObject.centerY;

    return {
      edgeX: clipInfo.worldX,
      edgeY: clipInfo.worldY,
      centerX,
      centerY,
      pathD: this.buildAnchorPath(line, endpoint, clipInfo, targetObject) ?? undefined,
    };
  }

  /**
   * Computes a clipped line path that stops at anchor edges instead of going to anchor centers.
   * When arrows are present on anchored ends, the line is shortened so the arrow tip appears at the edge.
   * Returns the SVG path 'd' attribute string, or the original path if no clipping is needed.
   * @param line The line object
   * @param offsetByViewBox If true, subtracts line.x and line.y from coordinates (for selection UI)
   */
  computeClippedLinePath(line: KritzelLine, offsetByViewBox: boolean = false): string {
    // Check for snap candidate first - this applies during drag operations even without anchors
    const snapCandidate = this.getSnapCandidate();
    const selectionGroup = this._core.store.selectionGroup;
    const hasActiveSnapCandidate = snapCandidate && selectionGroup && selectionGroup.objects.length === 1 && selectionGroup.objects[0].id === line.id;

    // If no anchors and no active snap candidate, return original path (with or without offset)
    if (!line.startAnchor && !line.endAnchor && !hasActiveSnapCandidate) {
      if (offsetByViewBox) {
        if (line.controlX !== undefined && line.controlY !== undefined) {
          return `M ${line.startX - line.x} ${line.startY - line.y} Q ${line.controlX - line.x} ${line.controlY - line.y} ${line.endX - line.x} ${line.endY - line.y}`;
        }
        return `M ${line.startX - line.x} ${line.startY - line.y} L ${line.endX - line.x} ${line.endY - line.y}`;
      }
      return line.d;
    }

    const startTarget = line.startAnchor ? this.findAnchorTarget(line, 'start') : null;
    const endTarget = line.endAnchor ? this.findAnchorTarget(line, 'end') : null;
    let startClip = startTarget ? this.computeAnchorClipInfo(line, 'start', startTarget) : null;
    let endClip = endTarget ? this.computeAnchorClipInfo(line, 'end', endTarget) : null;

    // Apply snap candidate if present and matches this line
    if (hasActiveSnapCandidate) {
      if (snapCandidate.edgeX !== undefined && snapCandidate.edgeY !== undefined) {
        const localEdge = this.lineWorldToLocal(line, snapCandidate.edgeX, snapCandidate.edgeY);
        const clipInfo: AnchorClipInfo = {
          worldX: snapCandidate.edgeX,
          worldY: snapCandidate.edgeY,
          localX: localEdge.x,
          localY: localEdge.y,
          t: snapCandidate.t
        };

        if (snapCandidate.endpoint === 'start') {
          startClip = clipInfo;
        } else {
          endClip = clipInfo;
        }
      }
    }

    // Apply offset if requested (for selection UI which uses coordinates relative to 0,0)
    const offsetX = offsetByViewBox ? line.x : 0;
    const offsetY = offsetByViewBox ? line.y : 0;

    // Handle curved lines by splitting the quadratic at the clipped parameters
    if (line.controlX !== undefined && line.controlY !== undefined) {
      let startT = startClip?.t ?? 0;
      let endT = endClip?.t ?? 1;


      // Adjust for start arrow
      if (startClip && line.hasStartArrow) {
        const arrowOffset = line.getArrowSize('start');
        const speed = this.evaluateDerivativeSpeedAtT(line, startT);
        if (speed > 0) {
          startT += arrowOffset / speed;
        }
      }

      // Adjust for end arrow
      if (endClip && line.hasEndArrow) {
        const arrowOffset = line.getArrowSize('end');
        const speed = this.evaluateDerivativeSpeedAtT(line, endT);
        if (speed > 0) {
          endT -= arrowOffset / speed;
        }
      }

      // Ensure valid range
      if (startT < 0) startT = 0;
      if (endT > 1) endT = 1;

      // Handle overlap or invalid range
      if (endT <= startT) {
        // If the arrow adjustment caused them to cross, or they were already crossed/close
        // We can either effectively hide the line, or just clamp them.
        // If we clamp them to the midpoint, the line becomes a point.
        // Let's ensure a minimal gap or just set them equal.
        const mid = (startT + endT) / 2;
        startT = mid;
        endT = mid;
      }

      const segment = this.extractQuadraticSegment(
        { x: line.startX, y: line.startY },
        { x: line.controlX, y: line.controlY },
        { x: line.endX, y: line.endY },
        startT,
        endT
      );

      return `M ${segment.start.x - offsetX} ${segment.start.y - offsetY} Q ${segment.control.x - offsetX} ${segment.control.y - offsetY} ${segment.end.x - offsetX} ${segment.end.y - offsetY}`;
    }

    // Straight lines fall back to linear interpolation
    let startX = startClip?.localX ?? line.startX;
    let startY = startClip?.localY ?? line.startY;
    let endX = endClip?.localX ?? line.endX;
    let endY = endClip?.localY ?? line.endY;

    if (startClip && line.hasStartArrow) {
      const arrowOffset = line.getArrowSize('start');
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > arrowOffset) {
        startX += (dx / length) * arrowOffset;
        startY += (dy / length) * arrowOffset;
      }
    }

    if (endClip && line.hasEndArrow) {
      const arrowOffset = line.getArrowSize('end');
      const dx = startX - endX;
      const dy = startY - endY;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > arrowOffset) {
        endX += (dx / length) * arrowOffset;
        endY += (dy / length) * arrowOffset;
      }
    }

    return `M ${startX - offsetX} ${startY - offsetY} L ${endX - offsetX} ${endY - offsetY}`;
  }

  public computeAnchorClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    if (line.controlX !== undefined && line.controlY !== undefined) {
      return this.computeCurvedClipInfo(line, endpoint, targetObject);
    }
    return this.computeStraightClipInfo(line, endpoint, targetObject);
  }

  private computeStraightClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    const reference = endpoint === 'start'
      ? this.lineLocalToWorld(line, line.endX, line.endY)
      : this.lineLocalToWorld(line, line.startX, line.startY);

    const edgeIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
      reference,
      { x: targetObject.centerX, y: targetObject.centerY },
      targetObject.rotatedPolygon
    );

    if (!edgeIntersection) {
      return null;
    }

    const localEdge = this.lineWorldToLocal(line, edgeIntersection.x, edgeIntersection.y);
    const totalLength = Math.sqrt(
      Math.pow(line.endX - line.startX, 2) +
      Math.pow(line.endY - line.startY, 2)
    );
    const distanceFromStart = Math.sqrt(
      Math.pow(localEdge.x - line.startX, 2) +
      Math.pow(localEdge.y - line.startY, 2)
    );
    const t = totalLength > 0 ? distanceFromStart / totalLength : endpoint === 'start' ? 0 : 1;

    return {
      localX: localEdge.x,
      localY: localEdge.y,
      worldX: edgeIntersection.x,
      worldY: edgeIntersection.y,
      t,
    };
  }

  private computeCurvedClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    const polygonPoints = this.getPolygonPoints(targetObject.rotatedPolygon);
    const exitPoint = this.findCurveExitPoint(line, endpoint, polygonPoints);
    if (exitPoint) {
      return exitPoint;
    }

    const reference = endpoint === 'start'
      ? this.lineLocalToWorld(line, line.endX, line.endY)
      : this.lineLocalToWorld(line, line.startX, line.startY);
    const fallbackIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
      reference,
      { x: targetObject.centerX, y: targetObject.centerY },
      targetObject.rotatedPolygon
    );

    if (!fallbackIntersection) {
      return null;
    }

    const localEdge = this.lineWorldToLocal(line, fallbackIntersection.x, fallbackIntersection.y);
    const approxT = this.approximateParameterForWorldPoint(line, fallbackIntersection);
    return {
      localX: localEdge.x,
      localY: localEdge.y,
      worldX: fallbackIntersection.x,
      worldY: fallbackIntersection.y,
      t: approxT,
    };
  }

  private findCurveExitPoint(line: KritzelLine, endpoint: 'start' | 'end', polygonPoints: KritzelPoint[]): AnchorClipInfo | null {
    const steps = 64;
    const initialT = endpoint === 'start' ? 0 : 1;
    const initialSample = this.evaluateLineAtT(line, initialT);
    let prevInside = KritzelGeometryHelper.isPointInPolygon({ x: initialSample.worldX, y: initialSample.worldY }, polygonPoints);
    let prevT = initialT;

    for (let i = 1; i <= steps; i++) {
      const t = endpoint === 'start' ? i / steps : 1 - i / steps;
      const sample = this.evaluateLineAtT(line, t);
      const inside = KritzelGeometryHelper.isPointInPolygon({ x: sample.worldX, y: sample.worldY }, polygonPoints);

      if (prevInside && !inside) {
        const refinedT = this.refineCurveExitParameter(line, polygonPoints, prevT, t);
        const refinedPoint = this.evaluateLineAtT(line, refinedT);
        return {
          localX: refinedPoint.localX,
          localY: refinedPoint.localY,
          worldX: refinedPoint.worldX,
          worldY: refinedPoint.worldY,
          t: refinedT,
        };
      }

      prevInside = inside;
      prevT = t;
    }

    return null;
  }

  private refineCurveExitParameter(line: KritzelLine, polygonPoints: KritzelPoint[], insideT: number, outsideT: number): number {
    let tInside = insideT;
    let tOutside = outsideT;

    for (let i = 0; i < 8; i++) {
      const mid = (tInside + tOutside) / 2;
      const sample = this.evaluateLineAtT(line, mid);
      const inside = KritzelGeometryHelper.isPointInPolygon({ x: sample.worldX, y: sample.worldY }, polygonPoints);
      if (inside) {
        tInside = mid;
      } else {
        tOutside = mid;
      }
    }

    return (tInside + tOutside) / 2;
  }

  private approximateParameterForWorldPoint(line: KritzelLine, target: { x: number; y: number }): number {
    const steps = 80;
    let bestT = 0;
    let bestDistance = Infinity;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sample = this.evaluateLineAtT(line, t);
      const distance = Math.hypot(sample.worldX - target.x, sample.worldY - target.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestT = t;
      }
    }

    return bestT;
  }

  private evaluateLineAtT(
    line: KritzelLine,
    t: number
  ): { t: number; localX: number; localY: number; worldX: number; worldY: number } {
    const clampedT = Math.max(0, Math.min(1, t));
    let localX: number;
    let localY: number;

    if (line.controlX !== undefined && line.controlY !== undefined) {
      const oneMinusT = 1 - clampedT;
      localX = oneMinusT * oneMinusT * line.startX + 2 * oneMinusT * clampedT * line.controlX + clampedT * clampedT * line.endX;
      localY = oneMinusT * oneMinusT * line.startY + 2 * oneMinusT * clampedT * line.controlY + clampedT * clampedT * line.endY;
    } else {
      localX = line.startX + (line.endX - line.startX) * clampedT;
      localY = line.startY + (line.endY - line.startY) * clampedT;
    }

    const world = this.lineLocalToWorld(line, localX, localY);
    return { t: clampedT, localX, localY, worldX: world.x, worldY: world.y };
  }

  private evaluateDerivativeSpeedAtT(line: KritzelLine, t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));

    if (line.controlX !== undefined && line.controlY !== undefined) {
      // Quadratic Bezier derivative: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
      const p0x = line.startX;
      const p0y = line.startY;
      const p1x = line.controlX;
      const p1y = line.controlY;
      const p2x = line.endX;
      const p2y = line.endY;

      const dx = 2 * (1 - clampedT) * (p1x - p0x) + 2 * clampedT * (p2x - p1x);
      const dy = 2 * (1 - clampedT) * (p1y - p0y) + 2 * clampedT * (p2y - p1y);

      return Math.sqrt(dx * dx + dy * dy);
    } else {
      // Straight line speed is constant length
      const dx = line.endX - line.startX;
      const dy = line.endY - line.startY;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  private extractQuadraticSegment(
    start: QuadraticPoint,
    control: QuadraticPoint,
    end: QuadraticPoint,
    tStart: number,
    tEnd: number
  ): QuadraticSegment {
    let normalizedStart = Math.max(0, Math.min(1, tStart));
    let normalizedEnd = Math.max(0, Math.min(1, tEnd));

    if (normalizedEnd < normalizedStart) {
      const swap = normalizedStart;
      normalizedStart = normalizedEnd;
      normalizedEnd = swap;
    }

    let segment: QuadraticSegment = { start, control, end };

    if (normalizedStart > 0) {
      const split = this.splitQuadraticSegment(segment, normalizedStart);
      segment = split.right;
      const remainingRange = 1 - normalizedStart;
      normalizedEnd = remainingRange > 0 ? (normalizedEnd - normalizedStart) / remainingRange : 1;
    }

    if (normalizedEnd < 1) {
      const split = this.splitQuadraticSegment(segment, normalizedEnd);
      segment = split.left;
    }

    return segment;
  }

  private splitQuadraticSegment(segment: QuadraticSegment, t: number): { left: QuadraticSegment; right: QuadraticSegment } {
    const clampedT = Math.max(0, Math.min(1, t));
    const p0 = segment.start;
    const p1 = segment.control;
    const p2 = segment.end;

    const p01 = this.lerpPoint(p0, p1, clampedT);
    const p12 = this.lerpPoint(p1, p2, clampedT);
    const p012 = this.lerpPoint(p01, p12, clampedT);

    return {
      left: { start: p0, control: p01, end: p012 },
      right: { start: p012, control: p12, end: p2 },
    };
  }

  private lerpPoint(a: QuadraticPoint, b: QuadraticPoint, t: number): QuadraticPoint {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  private buildAnchorPath(
    line: KritzelLine,
    endpoint: 'start' | 'end',
    clipInfo: AnchorClipInfo,
    targetObject: KritzelBaseObject<Element>
  ): string | null {
    if (line.controlX === undefined || line.controlY === undefined || clipInfo.t === undefined) {
      return `M ${clipInfo.worldX} ${clipInfo.worldY} L ${targetObject.centerX} ${targetObject.centerY}`;
    }

    const startT = endpoint === 'start' ? 0 : clipInfo.t;
    const endT = endpoint === 'start' ? clipInfo.t : 1;

    if (endT <= startT) {
      return `M ${clipInfo.worldX} ${clipInfo.worldY} L ${targetObject.centerX} ${targetObject.centerY}`;
    }

    const segment = this.extractQuadraticSegment(
      { x: line.startX, y: line.startY },
      { x: line.controlX, y: line.controlY },
      { x: line.endX, y: line.endY },
      startT,
      endT
    );

    const reverse = endpoint === 'start';
    return this.buildWorldQuadraticPath(line, segment, reverse);
  }

  private buildWorldQuadraticPath(line: KritzelLine, segment: QuadraticSegment, reverse: boolean = false): string {
    const startPoint = reverse ? segment.end : segment.start;
    const endPoint = reverse ? segment.start : segment.end;
    const controlPoint = segment.control;

    const startWorld = this.lineLocalToWorld(line, startPoint.x, startPoint.y);
    const controlWorld = this.lineLocalToWorld(line, controlPoint.x, controlPoint.y);
    const endWorld = this.lineLocalToWorld(line, endPoint.x, endPoint.y);

    return `M ${startWorld.x} ${startWorld.y} Q ${controlWorld.x} ${controlWorld.y} ${endWorld.x} ${endWorld.y}`;
  }

  private getPolygonPoints(polygon: KritzelPolygon): KritzelPoint[] {
    return [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
  }

  /**
   * Converts local line coordinates to world coordinates.
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
   * Converts world coordinates to line's local SVG coordinates.
   */
  private lineWorldToLocal(line: KritzelLine, worldX: number, worldY: number): { x: number; y: number } {
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
   * Checks if an object can be used as an anchor target.
   */
  private isAnchorable(object: KritzelBaseObject<Element>): boolean {
    // Exclude selection-related objects
    if (object instanceof KritzelSelectionBox || object instanceof KritzelSelectionGroup) {
      return false;
    }

    // Exclude line objects - lines cannot be anchored to other lines
    if (object instanceof KritzelLine) {
      return false;
    }

    // All other visible objects can be anchored to
    return object.isVisible;
  }
}
