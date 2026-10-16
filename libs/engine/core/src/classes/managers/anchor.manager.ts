import {
  AnchorIndexEntry,
  AnchorLinesRenderData,
  AnchorVisualization,
  LineAnchor,
  SnapCandidate,
  SnapIndicatorCandidate,
  SnapIndicatorRenderData,
  SnapPreviewCandidate,
  SnapTarget,
} from '../../interfaces/anchor.interface';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelClassHelper } from '../../helpers/class.helper';
import type { KritzelGroup } from '../objects/group.class';
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

  /**
   * Creates a new KritzelAnchorManager instance.
   * @param core - The KritzelCore instance that provides access to the store and other managers.
   */
  constructor(core: KritzelCore) {
    this._core = core;
  }

  // ============================================
  // Anchor CRUD Operations
  // ============================================

  /**
   * Sets an anchor from a line endpoint to a target object's center.
   * Updates both the line's anchor property and the internal index.
   * Prevents anchoring both endpoints of the same line to the same object.
   * 
   * @param lineId - The unique identifier of the line to anchor.
   * @param endpoint - Which endpoint of the line to anchor ('start' or 'end').
   * @param targetObjectId - The unique identifier of the object to anchor to.
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
    this._core.store.objects.update(line);
  }

  /**
   * Removes an anchor from a line endpoint.
   * Updates both the line's anchor property and the internal index.
   * 
   * @param lineId - The unique identifier of the line.
   * @param endpoint - Which endpoint's anchor to remove ('start' or 'end').
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
   * 
   * @param lineId - The unique identifier of the line.
   * @param endpoint - Which endpoint to get the anchor for ('start' or 'end').
   * @returns The LineAnchor object if an anchor exists, null otherwise.
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
   * Uses the internal anchor index for efficient reverse lookup.
   * 
   * @param objectId - The unique identifier of the object to query.
   * @returns An array of AnchorIndexEntry objects containing lineId and endpoint information.
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
   * Should be called when an object moves to keep anchored lines in sync.
   * 
   * @param objectId - The unique identifier of the object that has moved.
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

    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup || !this._core.store.state.isDragging) {
      return;
    }

    if (selectionGroup.hasExternalAnchoredLineConnections()) {
      // Keep the local drag overlay aligned with reshaped anchored lines without spamming Yjs.
      selectionGroup.refreshObjectDimensions(undefined, true);
    }
  }

  /**
   * Snaps a line endpoint to an object's center position.
   * Converts world coordinates to the line's local coordinate system before updating.
   * 
   * @param line - The KritzelLine object to update.
   * @param endpoint - Which endpoint to snap ('start' or 'end').
   * @param targetObjectId - The unique identifier of the target object to snap to.
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
   * Applies inverse rotation and scale transformations to translate
   * from global canvas coordinates to the line's internal SVG coordinates.
   * 
   * @param line - The KritzelLine object providing the transformation context.
   * @param worldX - The X coordinate in world/canvas space.
   * @param worldY - The Y coordinate in world/canvas space.
   * @returns An object containing the local x and y coordinates.
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
   * Finds an object that can be snapped to when the cursor is sufficiently close to its center.
   * Snap is only triggered when the cursor is inside the object's bounds AND within 1/5 of the
   * shorter side from the center, so snapping activates only as the user approaches the center
   * and releases quickly as they move away.
   * Returns null if no suitable snap target is found.
   *
   * @param worldX - X coordinate in world space
   * @param worldY - Y coordinate in world space
   * @param excludeLineId - ID of the line being edited (to exclude from snap targets)
   * @param otherEndpointAnchorId - ID of object anchored to the other endpoint (to prevent same-object anchoring)
   * @param pointerType - The pointer type driving the drag interaction.
   */
  findSnapTarget(
    worldX: number,
    worldY: number,
    excludeLineId: string,
    otherEndpointAnchorId?: string,
    pointerType: string = 'mouse'
  ): SnapTarget | null {
    return this.findBestSnapTarget(worldX, worldY, excludeLineId, otherEndpointAnchorId, object => {
      const snapRadius = this.getSnapRadius(object, pointerType);
      const dx = worldX - object.centerX;
      const dy = worldY - object.centerY;
      const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

      return distanceToCenter <= snapRadius;
    });
  }

  /**
   * Finds the topmost anchorable object currently containing the dragged endpoint.
   * Used to drive preview UI before an actual snap engages.
   */
  findSnapPreviewTarget(
    worldX: number,
    worldY: number,
    excludeLineId: string,
    otherEndpointAnchorId?: string
  ): SnapTarget | null {
    return this.findBestSnapTarget(worldX, worldY, excludeLineId, otherEndpointAnchorId, () => true);
  }

  private findBestSnapTarget(
    worldX: number,
    worldY: number,
    excludeLineId: string,
    otherEndpointAnchorId: string | undefined,
    predicate: (object: KritzelBaseObject<Element>) => boolean
  ): SnapTarget | null {
    let bestTarget: SnapTarget | null = null;
    let bestObject: KritzelBaseObject<Element> | null = null;
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

      if (!KritzelGeometryHelper.isPointInPolygon({ x: worldX, y: worldY }, points)) {
        continue;
      }

      if (!predicate(object)) {
        continue;
      }

      // A group shares its zIndex with its top member; prefer the group, which is the selectable layer.
      if (object.zIndex > highestZIndex || (object.zIndex === highestZIndex && bestObject && this.containsDescendant(object, bestObject))) {
        highestZIndex = object.zIndex;
        bestObject = object;
        bestTarget = {
          objectId: object.id,
          centerX: object.centerX,
          centerY: object.centerY,
        };
      }
    }

    return bestTarget;
  }

  private getSnapRadius(object: KritzelBaseObject<Element>, pointerType: string): number {
    const baseRadius = Math.min(object.width, object.height) / 5;
    const safeScale = this.getSafeScale(this._core.store.state.scale);
    if (pointerType === 'touch' || pointerType === 'pen') {
      return Math.max(baseRadius * 1.75, 24 / safeScale);
    }

    return Math.max(baseRadius, 12 / safeScale);
  }

  /**
   * Sets the current snap candidate for visual feedback during line endpoint dragging.
   * Updates the store state and triggers a rerender to show the snap indicator.
   * 
   * @param candidate - The SnapCandidate object containing snap target info, or null to clear.
   */
  setSnapCandidate(candidate: SnapCandidate | null): void {
    this._core.store.state.snapCandidate = candidate;
    this._core.rerender();
  }

  /**
   * Sets the current snap preview candidate for early visual feedback during line dragging.
   * Preview state must remain separate from active snap state so line clipping and anchor
   * commit semantics only react to actual snaps.
   *
   * @param candidate - The preview candidate object, or null to clear.
   */
  setSnapPreviewCandidate(candidate: SnapPreviewCandidate | null): void {
    this._core.store.state.snapPreviewCandidate = candidate;
    this._core.rerender();
  }

  /**
   * Gets the current snap candidate from the store state.
   * 
   * @returns The current SnapCandidate object if one exists, null otherwise.
   */
  getSnapCandidate(): SnapCandidate | null {
    return this._core.store.state.snapCandidate ?? null;
  }

  /**
   * Gets the current snap preview candidate from the store state.
   *
   * @returns The current preview candidate if one exists, null otherwise.
   */
  getSnapPreviewCandidate(): SnapPreviewCandidate | null {
    return this._core.store.state.snapPreviewCandidate ?? null;
  }

  /**
   * Clears the snap candidate from the store state and triggers a rerender.
   * Should be called when snapping is cancelled or completed.
   */
  clearSnapCandidate(): void {
    this._core.store.state.snapCandidate = null;
    this._core.rerender();
  }

  /**
   * Clears the snap preview candidate from the store state and triggers a rerender.
   */
  clearSnapPreviewCandidate(): void {
    this._core.store.state.snapPreviewCandidate = null;
    this._core.rerender();
  }

  // ============================================
  // Render Data
  // ============================================

  /**
   * Gets render data for anchor lines visualization.
   * Computes stroke widths, dash patterns, and indicator sizes scaled to the current viewport.
   * 
   * @returns AnchorLinesRenderData object containing visualization parameters and anchor
   *          visualization data for both endpoints, or null if there's no selected line
   *          with anchors.
   */
  getAnchorLinesRenderData(): AnchorLinesRenderData | null {
    const selectionGroup = this._core.store.selectionGroup;
    if (!selectionGroup || selectionGroup.objects.length !== 1) return null;

    const selectedObject = selectionGroup.objects[0];
    if (!KritzelClassHelper.isInstanceOf<KritzelLine>(selectedObject, 'KritzelLine')) return null;

    const line = selectedObject as KritzelLine;



    const startAnchorVizRaw = this.computeAnchorVisualization(line, 'start');
    const endAnchorVizRaw = this.computeAnchorVisualization(line, 'end');

    const startAnchorViz = this.isFiniteAnchorVisualization(startAnchorVizRaw) ? startAnchorVizRaw : null;
    const endAnchorViz = this.isFiniteAnchorVisualization(endAnchorVizRaw) ? endAnchorVizRaw : null;

    if (!startAnchorViz && !endAnchorViz) return null;

    const scale = this.getSafeScale(this._core.store.state.scale);
    const lineScale = this.getSafeScale(line.scale);
    const lineStrokeWidth = line.strokeWidth / lineScale;
    const indicatorStrokeWidth = `${2 / scale}`;
    const dashLength = Math.max(lineStrokeWidth * 2, 4 / scale);
    const dashArray = `${dashLength} ${dashLength}`;
    const indicatorRadius = 8 / scale;

    if (!this.areFiniteNumbers(lineStrokeWidth, dashLength, indicatorRadius)) {
      return null;
    }

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
   * Computes all visual parameters needed to render the snap preview including
   * indicator radius, stroke widths, dash patterns, and arrow geometry.
   * 
   * @returns SnapIndicatorRenderData object containing all visualization parameters,
   *          or null if there's no active snap candidate.
   */
  getSnapIndicatorRenderData(): SnapIndicatorRenderData | null {
    return this.getIndicatorRenderDataForCandidate(this.getSnapCandidate());
  }

  /**
   * Gets render data for snap preview visualization.
   *
   * @returns SnapIndicatorRenderData for the active preview candidate, or null if none exists.
   */
  getSnapPreviewRenderData(): SnapIndicatorRenderData | null {
    return this.getIndicatorRenderDataForCandidate(this.getSnapPreviewCandidate());
  }

  private getIndicatorRenderDataForCandidate(candidate: SnapIndicatorCandidate | null): SnapIndicatorRenderData | null {
    if (!candidate) return null;

    if (!this.areFiniteNumbers(candidate.centerX, candidate.centerY, candidate.lineEndpointX, candidate.lineEndpointY)) {
      return null;
    }

    const scale = this.getSafeScale(this._core.store.state.scale);
    const indicatorRadius = 8 / scale;
    const indicatorStrokeWidth = `${2 / scale}`;
    const lineStrokeWidthNum = this.areFiniteNumbers(candidate.lineStrokeWidth) && (candidate.lineStrokeWidth as number) > 0
      ? (candidate.lineStrokeWidth as number)
      : (4 / scale);
    const lineStrokeWidth = `${lineStrokeWidthNum}`;
    const dashLength = Math.max(lineStrokeWidthNum * 2, 4 / scale);
    const dashArray = `${dashLength} ${dashLength}`;
    const lineStroke = candidate.lineStroke || '#000000';

    let edgeX = this.areFiniteNumbers(candidate.edgeX) ? candidate.edgeX : undefined;
    let edgeY = this.areFiniteNumbers(candidate.edgeY) ? candidate.edgeY : undefined;
    let solidLineEndX = edgeX;
    let solidLineEndY = edgeY;
    let arrowPoints: string | undefined;

    const arrowOffset = this.areFiniteNumbers(candidate.arrowOffset) && (candidate.arrowOffset as number) > 0
      ? (candidate.arrowOffset as number)
      : undefined;

    if (arrowOffset !== undefined && edgeX !== undefined && edgeY !== undefined) {
      const dx = candidate.lineEndpointX - edgeX;
      const dy = candidate.lineEndpointY - edgeY;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > arrowOffset) {
        solidLineEndX = edgeX + (dx / length) * arrowOffset;
        solidLineEndY = edgeY + (dy / length) * arrowOffset;
      }

      // Calculate arrow head points
      // Direction from line endpoint to edge (arrow direction)
      const arrowDx = edgeX - candidate.lineEndpointX;
      const arrowDy = edgeY - candidate.lineEndpointY;
      const arrowLengthTotal = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

      if (arrowLengthTotal > 0) {
        const ux = arrowDx / arrowLengthTotal;
        const uy = arrowDy / arrowLengthTotal;
        // Perpendicular vector
        const px = -uy;
        const py = ux;

        // Arrow dimensions
        const arrowLength = arrowOffset;
        const arrowWidth = arrowLength; // 1:1 ratio

        // Arrow tip at edge
        const tipX = edgeX;
        const tipY = edgeY;

        // Arrow base
        const baseX = tipX - ux * arrowLength;
        const baseY = tipY - uy * arrowLength;

        // Arrow wings
        const leftX = baseX + px * arrowWidth / 2;
        const leftY = baseY + py * arrowWidth / 2;
        const rightX = baseX - px * arrowWidth / 2;
        const rightY = baseY - py * arrowWidth / 2;

        if (this.areFiniteNumbers(tipX, tipY, leftX, leftY, rightX, rightY)) {
          arrowPoints = `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
        }
      }
    }

    if (!this.areFiniteNumbers(indicatorRadius, lineStrokeWidthNum, dashLength)) {
      return null;
    }

    const snapLinePath = (() => {
      if (
        candidate.controlX !== undefined &&
        candidate.controlY !== undefined &&
        candidate.t !== undefined &&
        this.areFiniteNumbers(candidate.controlX, candidate.controlY, candidate.t)
      ) {
        const startT = candidate.endpoint === 'start' ? 1 - candidate.t : candidate.t;

        // Ensure meaningful range
        if (startT >= 1) return undefined;

        const segment = this.extractQuadraticSegment(
          { x: candidate.lineEndpointX, y: candidate.lineEndpointY },
          { x: candidate.controlX, y: candidate.controlY },
          { x: candidate.centerX, y: candidate.centerY },
          startT,
          1
        );

        if (!this.areFiniteNumbers(segment.start.x, segment.start.y, segment.control.x, segment.control.y, segment.end.x, segment.end.y)) {
          return undefined;
        }

        return `M ${segment.start.x} ${segment.start.y} Q ${segment.control.x} ${segment.control.y} ${segment.end.x} ${segment.end.y}`;
      }
      return undefined;
    })();

    return {
      indicatorRadius,
      indicatorStrokeWidth,
      lineStrokeWidth,
      dashArray,
      lineStroke,
      centerX: candidate.centerX,
      centerY: candidate.centerY,
      lineEndpointX: candidate.lineEndpointX,
      lineEndpointY: candidate.lineEndpointY,
      edgeX,
      edgeY,
      arrowOffset,
      arrowStyle: candidate.arrowStyle,
      arrowFill: candidate.arrowFill,
      solidLineEndX,
      solidLineEndY,
      arrowPoints,
      snapLinePath,
    };
  }

  // ============================================
  // Cleanup Operations
  // ============================================

  /**
   * Handles cleanup when an object is deleted from the canvas.
   * Detaches all lines that were anchored to the deleted object and
   * removes the object from the internal anchor index.
   * 
   * @param objectId - The unique identifier of the deleted object.
   */
  handleObjectDeleted(objectId: string): void {
    const entries = this.getLinesAnchoredTo(objectId);

    for (const entry of entries) {
      this.removeAnchor(entry.lineId, entry.endpoint);

      // Update the line to persist the change
      const line = this.getLineById(entry.lineId);
      if (line) {
        this._core.store.objects.update(line);
      }
    }

    // Remove the object from the index
    this._anchorIndex.delete(objectId);
  }

  /**
   * Handles cleanup when a line is deleted from the canvas.
   * Removes all anchor index entries for the deleted line.
   * 
   * @param lineId - The unique identifier of the deleted line.
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
   * Iterates through all KritzelLine objects and indexes their anchor connections.
   * Should be called after loading/deserializing objects or when the index may be stale.
   */
  rebuildIndex(): void {
    this._anchorIndex.clear();

    const objects = this._core.store.allObjects;

    for (const object of objects) {
      if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
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
   * Creates a new Set for the object if it doesn't exist in the index.
   * Prevents duplicate entries by checking for existing matches.
   * 
   * @param objectId - The unique identifier of the anchored-to object.
   * @param lineId - The unique identifier of the line with the anchor.
   * @param endpoint - Which endpoint of the line is anchored ('start' or 'end').
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
   * Cleans up empty Sets from the index to prevent memory leaks.
   * 
   * @param objectId - The unique identifier of the anchored-to object.
   * @param lineId - The unique identifier of the line with the anchor.
   * @param endpoint - Which endpoint of the line is anchored ('start' or 'end').
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
   * Gets a KritzelLine object by its unique identifier.
   * 
   * @param lineId - The unique identifier of the line to retrieve.
   * @returns The KritzelLine object if found and is a line, null otherwise.
   */
  private getLineById(lineId: string): KritzelLine | null {
    const objects = this._core.store.objects.filter(o => o.id === lineId);
    if (objects.length === 0) {
      return null;
    }
    const object = objects[0];
    return KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine') ? object : null;
  }

  /**
   * Gets any KritzelBaseObject by its unique identifier.
   * 
   * @param objectId - The unique identifier of the object to retrieve.
   * @returns The KritzelBaseObject if found, null otherwise.
   */
  private getObjectById(objectId: string): KritzelBaseObject<Element> | null {
    const objects = this._core.store.objects.filter(o => o.id === objectId);
    return objects.length > 0 ? objects[0] : null;
  }

  /**
   * Finds the target object that a line endpoint is anchored to.
   * Searches among all non-selection objects in the store.
   * 
   * @param line - The KritzelLine object to check.
   * @param endpoint - Which endpoint to check ('start' or 'end').
   * @returns The target KritzelBaseObject if the anchor exists and target is found, null otherwise.
   */
  public findAnchorTarget(line: KritzelLine, endpoint: 'start' | 'end'): KritzelBaseObject<Element> | null {
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
   * Computes anchor visualization data for a specific endpoint of a line with anchors.
   * Calculates edge intersection points for rendering dashed lines from edge to center.
   * 
   * @param line - The KritzelLine object to compute visualization for.
   * @param endpoint - Which endpoint to compute visualization for ('start' or 'end').
   * @returns AnchorVisualization object containing edge and center coordinates plus
   *          optional path data for curved lines, or null if no anchor exists.
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

    if (!this.areFiniteNumbers(clipInfo.worldX, clipInfo.worldY, centerX, centerY)) {
      return null;
    }

    const pathD = this.buildAnchorPath(line, endpoint, clipInfo, targetObject) ?? undefined;
    if (pathD && !this.isFinitePathData(pathD)) {
      return null;
    }

    return {
      edgeX: clipInfo.worldX,
      edgeY: clipInfo.worldY,
      centerX,
      centerY,
      pathD,
    };
  }

  /**
   * Computes a clipped line path that stops at anchor edges instead of going to anchor centers.
   * When arrows are present on anchored ends, the line is shortened so the arrow tip appears at the edge.
   * Handles both straight lines and curved (quadratic Bezier) lines.
   * 
   * @param line - The KritzelLine object to compute the clipped path for.
   * @param offsetByViewBox - If true, subtracts line.x and line.y from coordinates (for selection UI).
   * @returns The SVG path 'd' attribute string, or the original path if no clipping is needed.
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

  /**
   * Computes anchor clipping information for a line endpoint connected to a target object.
   * Dispatches to either curved or straight line computation based on line type.
   * 
   * @param line - The KritzelLine object.
   * @param endpoint - Which endpoint to compute clip info for ('start' or 'end').
   * @param targetObject - The object the line is anchored to.
   * @returns AnchorClipInfo containing local and world coordinates of the clip point,
   *          plus parameter t for curved lines, or null if computation fails.
   */
  public computeAnchorClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    if (line.controlX !== undefined && line.controlY !== undefined) {
      return this.computeCurvedClipInfo(line, endpoint, targetObject);
    }
    return this.computeStraightClipInfo(line, endpoint, targetObject);
  }

  /**
   * Computes clip information for a straight line anchored to a target object.
   * Uses ray-casting from the opposite endpoint through the target's edge.
   * 
   * @param line - The KritzelLine object (must be a straight line, no control point).
   * @param endpoint - Which endpoint is anchored ('start' or 'end').
   * @param targetObject - The object the line is anchored to.
   * @returns AnchorClipInfo with intersection coordinates and parameter t, or null if no intersection.
   */
  private computeStraightClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    const reference = endpoint === 'start'
      ? this.lineLocalToWorld(line, line.endX, line.endY)
      : this.lineLocalToWorld(line, line.startX, line.startY);

    // Check for path object (uses stroke edge detection)
    const pathClipPoint = this.getPathClipPoint(targetObject, reference);
    if (pathClipPoint) {
      const localEdge = this.lineWorldToLocal(line, pathClipPoint.x, pathClipPoint.y);
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
        worldX: pathClipPoint.x,
        worldY: pathClipPoint.y,
        t,
      };
    }

    // Check for custom clip polygon (ellipse, triangle shapes)
    const customClipPolygon = this.getClipPolygonForObject(targetObject);

    let edgeIntersection: KritzelPoint | null;
    if (customClipPolygon) {
      // Use custom polygon for non-rectangular shapes
      edgeIntersection = KritzelGeometryHelper.getLinePointsArrayIntersection(
        reference,
        { x: targetObject.centerX, y: targetObject.centerY },
        customClipPolygon
      );
    } else {
      // Fall back to bounding box for rectangles and other objects
      edgeIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
        reference,
        { x: targetObject.centerX, y: targetObject.centerY },
        targetObject.rotatedPolygon
      );
    }

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

  /**
   * Computes clip information for a curved (quadratic Bezier) line anchored to a target object.
   * Samples along the curve to find where it exits the target object's bounds.
   * 
   * @param line - The KritzelLine object (must have controlX and controlY defined).
   * @param endpoint - Which endpoint is anchored ('start' or 'end').
   * @param targetObject - The object the line is anchored to.
   * @returns AnchorClipInfo with intersection coordinates and parameter t, or null if no intersection.
   */
  private computeCurvedClipInfo(line: KritzelLine, endpoint: 'start' | 'end', targetObject: KritzelBaseObject<Element>): AnchorClipInfo | null {
    // Check for path object (uses stroke edge detection via sampling)
    if (KritzelClassHelper.isInstanceOf<KritzelPath>(targetObject, 'KritzelPath')) {
      // For curved lines to paths, sample along the curve to find stroke edge
      const path = targetObject as KritzelPath;
      return this.findCurveExitPointForPath(line, endpoint, path);
    }

    // Check for custom clip polygon (ellipse, triangle shapes)
    const customClipPolygon = this.getClipPolygonForObject(targetObject);
    const polygonPoints = customClipPolygon ?? this.getPolygonPoints(targetObject.rotatedPolygon);

    const exitPoint = this.findCurveExitPoint(line, endpoint, polygonPoints);
    if (exitPoint) {
      return exitPoint;
    }

    const reference = endpoint === 'start'
      ? this.lineLocalToWorld(line, line.endX, line.endY)
      : this.lineLocalToWorld(line, line.startX, line.startY);

    let fallbackIntersection: KritzelPoint | null;
    if (customClipPolygon) {
      fallbackIntersection = KritzelGeometryHelper.getLinePointsArrayIntersection(
        reference,
        { x: targetObject.centerX, y: targetObject.centerY },
        customClipPolygon
      );
    } else {
      fallbackIntersection = KritzelGeometryHelper.getLinePolygonIntersection(
        reference,
        { x: targetObject.centerX, y: targetObject.centerY },
        targetObject.rotatedPolygon
      );
    }

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

  /**
   * Finds the point where a curved line exits a polygon boundary.
   * Samples along the curve from the anchored endpoint outward, detecting
   * the transition from inside to outside the polygon, then refines the result.
   * 
   * @param line - The KritzelLine object (curved line with control point).
   * @param endpoint - Which endpoint is anchored inside the polygon ('start' or 'end').
   * @param polygonPoints - Array of points defining the polygon boundary.
   * @returns AnchorClipInfo with the exit point coordinates and parameter t, or null if no exit found.
   */
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

  /**
   * Finds the exit point for a curved line going to a Path object.
   * Uses distance-to-stroke sampling instead of polygon containment
   * to detect when the line exits the path's stroke width boundary.
   * 
   * @param line - The KritzelLine object (curved line with control point).
   * @param endpoint - Which endpoint is anchored to the path ('start' or 'end').
   * @param path - The KritzelPath object the line is anchored to.
   * @returns AnchorClipInfo with the exit point coordinates and parameter t, or null if no exit found.
   */
  private findCurveExitPointForPath(line: KritzelLine, endpoint: 'start' | 'end', path: KritzelPath): AnchorClipInfo | null {
    const steps = 64;
    const initialT = endpoint === 'start' ? 0 : 1;
    const halfStroke = path.strokeWidth / path.scale / 2;

    // Ensure path has computed points
    const pathPoints = this.getPathAdjustedPoints(path);
    if (pathPoints.length < 1) {
      return null;
    }

    // Check if starting point is inside the stroke
    const initialSample = this.evaluateLineAtT(line, initialT);
    let prevInside = this.isPointInPathStroke(initialSample.worldX, initialSample.worldY, pathPoints, halfStroke);
    let prevT = initialT;

    for (let i = 1; i <= steps; i++) {
      const t = endpoint === 'start' ? i / steps : 1 - i / steps;
      const sample = this.evaluateLineAtT(line, t);
      const inside = this.isPointInPathStroke(sample.worldX, sample.worldY, pathPoints, halfStroke);

      if (prevInside && !inside) {
        // Refine using binary search
        const refinedT = this.refineCurveExitParameterForPath(line, pathPoints, halfStroke, prevT, t);
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

  /**
   * Refines the curve exit parameter for a Path object using binary search.
   * Narrows down the exact parameter t where the curve exits the path's stroke.
   * 
   * @param line - The KritzelLine object being evaluated.
   * @param pathPoints - Array of adjusted path points [[x, y], ...].
   * @param halfStroke - Half of the path's stroke width for distance checks.
   * @param insideT - Parameter t known to be inside the stroke.
   * @param outsideT - Parameter t known to be outside the stroke.
   * @returns The refined parameter t at the stroke boundary.
   */
  private refineCurveExitParameterForPath(
    line: KritzelLine,
    pathPoints: number[][],
    halfStroke: number,
    insideT: number,
    outsideT: number
  ): number {
    let tInside = insideT;
    let tOutside = outsideT;

    for (let i = 0; i < 8; i++) {
      const mid = (tInside + tOutside) / 2;
      const sample = this.evaluateLineAtT(line, mid);
      const inside = this.isPointInPathStroke(sample.worldX, sample.worldY, pathPoints, halfStroke);
      if (inside) {
        tInside = mid;
      } else {
        tOutside = mid;
      }
    }

    return (tInside + tOutside) / 2;
  }

  /**
   * Gets the adjusted world-space points for a Path object.
   * Wrapper that delegates to computePathAdjustedPoints.
   * 
   * @param path - The KritzelPath object to get points for.
   * @returns Array of [x, y] coordinate pairs in world space.
   */
  private getPathAdjustedPoints(path: KritzelPath): number[][] {
    // Access the path's adjusted points through its internal computation
    // We'll need to manually compute them since they're private
    return this.computePathAdjustedPoints(path);
  }

  /**
   * Computes world-space adjusted points for a Path object.
   * Applies rotation and scale transformations to convert the path's
   * internal points to world coordinates.
   * 
   * @param path - The KritzelPath object to compute points for.
   * @returns Array of [x, y] coordinate pairs in world space, or empty array if path has no points.
   */
  private computePathAdjustedPoints(path: KritzelPath): number[][] {
    if (!path.points?.length) {
      return [];
    }

    const angle = path.rotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const xs = path.points.map(p => p[0]);
    const ys = path.points.map(p => p[1]);
    const pivot = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    const { x: cx, y: cy } = pivot;

    const rotatedPoints = path.points.map(([x, y]) => {
      const dx = x - cx;
      const dy = y - cy;
      return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    });

    return rotatedPoints.map(([px, py]) => [
      Math.abs(px - path.x) / path.scale + path.translateX,
      Math.abs(py - path.y) / path.scale + path.translateY,
    ]);
  }

  /**
   * Checks if a point is within the stroke width of a Path.
   * Tests distance from the point to each segment of the path.
   * 
   * @param x - X coordinate in world space.
   * @param y - Y coordinate in world space.
   * @param pathPoints - Array of [x, y] coordinate pairs defining the path.
   * @param halfStroke - Half of the stroke width (the distance threshold).
   * @returns True if the point is within halfStroke distance of any path segment.
   */
  private isPointInPathStroke(x: number, y: number, pathPoints: number[][], halfStroke: number): boolean {
    if (pathPoints.length === 1) {
      const p = pathPoints[0];
      const dx = x - p[0];
      const dy = y - p[1];
      return Math.sqrt(dx * dx + dy * dy) <= halfStroke;
    }

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const dist = this.pointToSegmentDistance(x, y, p1[0], p1[1], p2[0], p2[1]);
      if (dist <= halfStroke) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates the shortest distance from a point to a line segment.
   * Uses projection to find the nearest point on the segment, clamped to segment bounds.
   * 
   * @param px - X coordinate of the point.
   * @param py - Y coordinate of the point.
   * @param x1 - X coordinate of segment start.
   * @param y1 - Y coordinate of segment start.
   * @param x2 - X coordinate of segment end.
   * @param y2 - Y coordinate of segment end.
   * @returns The distance from the point to the nearest point on the segment.
   */
  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;

    return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
  }



  /**
   * Refines the curve exit parameter using binary search.
   * Narrows down the exact parameter t where the curve exits a polygon.
   * 
   * @param line - The KritzelLine object being evaluated.
   * @param polygonPoints - Array of points defining the polygon boundary.
   * @param insideT - Parameter t known to be inside the polygon.
   * @param outsideT - Parameter t known to be outside the polygon.
   * @returns The refined parameter t at the polygon boundary.
   */
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

  /**
   * Approximates the curve parameter t for a given world point by sampling.
   * Finds the t value that produces a point closest to the target.
   * 
   * @param line - The KritzelLine object to evaluate.
   * @param target - The target point with x and y coordinates in world space.
   * @returns The parameter t (0 to 1) that produces the closest point on the line.
   */
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

  /**
   * Evaluates a line at parameter t to get both local and world coordinates.
   * For curved lines, uses quadratic Bezier interpolation.
   * For straight lines, uses linear interpolation.
   * 
   * @param line - The KritzelLine object to evaluate.
   * @param t - The parameter value (0 = start, 1 = end).
   * @returns Object containing clamped t, local coordinates, and world coordinates.
   */
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

  /**
   * Calculates the derivative speed (magnitude of tangent vector) at parameter t.
   * For quadratic Bezier: |B'(t)| = |2(1-t)(P1-P0) + 2t(P2-P1)|
   * For straight lines: constant length of the line segment.
   * 
   * @param line - The KritzelLine object to evaluate.
   * @param t - The parameter value (0 to 1).
   * @returns The magnitude of the derivative (units per parameter unit).
   */
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

  /**
   * Extracts a sub-segment from a quadratic Bezier curve.
   * Uses de Casteljau's algorithm to split the curve at the specified t values.
   * 
   * @param start - The start point of the original curve.
   * @param control - The control point of the original curve.
   * @param end - The end point of the original curve.
   * @param tStart - The parameter value for the new start (0 to 1).
   * @param tEnd - The parameter value for the new end (0 to 1).
   * @returns A new QuadraticSegment representing the sub-curve from tStart to tEnd.
   */
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

  /**
   * Splits a quadratic Bezier segment at parameter t using de Casteljau's algorithm.
   * 
   * @param segment - The original QuadraticSegment to split.
   * @param t - The parameter value to split at (0 to 1).
   * @returns An object containing left and right QuadraticSegments.
   */
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

  /**
   * Linearly interpolates between two points.
   * 
   * @param a - The start point.
   * @param b - The end point.
   * @param t - The interpolation factor (0 = a, 1 = b).
   * @returns A new QuadraticPoint at the interpolated position.
   */
  private lerpPoint(a: QuadraticPoint, b: QuadraticPoint, t: number): QuadraticPoint {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  }

  /**
   * Builds an SVG path for the anchor visualization from clip point to target center.
   * For straight lines, returns a simple line path. For curved lines, extracts and
   * transforms the appropriate Bezier segment.
   * 
   * @param line - The KritzelLine object.
   * @param endpoint - Which endpoint is anchored ('start' or 'end').
   * @param clipInfo - The computed clip information including coordinates and parameter t.
   * @param targetObject - The target object the line is anchored to.
   * @returns SVG path 'd' attribute string, or null if path cannot be built.
   */
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

  /**
   * Builds an SVG quadratic Bezier path in world coordinates from a segment.
   * Applies line transformations to convert local segment coordinates to world space.
   * 
   * @param line - The KritzelLine providing transformation context.
   * @param segment - The QuadraticSegment to convert to a path.
   * @param reverse - If true, draws the path from end to start.
   * @returns SVG path 'd' attribute string with M and Q commands.
   */
  private buildWorldQuadraticPath(line: KritzelLine, segment: QuadraticSegment, reverse: boolean = false): string {
    const startPoint = reverse ? segment.end : segment.start;
    const endPoint = reverse ? segment.start : segment.end;
    const controlPoint = segment.control;

    const startWorld = this.lineLocalToWorld(line, startPoint.x, startPoint.y);
    const controlWorld = this.lineLocalToWorld(line, controlPoint.x, controlPoint.y);
    const endWorld = this.lineLocalToWorld(line, endPoint.x, endPoint.y);

    return `M ${startWorld.x} ${startWorld.y} Q ${controlWorld.x} ${controlWorld.y} ${endWorld.x} ${endWorld.y}`;
  }

  /**
   * Converts a KritzelPolygon to an array of corner points.
   * 
   * @param polygon - The KritzelPolygon with topLeft, topRight, bottomRight, bottomLeft corners.
   * @returns Array of KritzelPoint in clockwise order starting from topLeft.
   */
  private getPolygonPoints(polygon: KritzelPolygon): KritzelPoint[] {
    return [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
  }

  /**
   * Gets the custom clip polygon for an object if it has one.
   * Used for non-rectangular shapes like ellipses and triangles that need
   * special edge detection instead of using the default bounding box.
   * 
   * @param object - The object to check for a custom clip polygon.
   * @returns Array of KritzelPoint defining the clip boundary, or null for default behavior.
   */
  private getClipPolygonForObject(object: KritzelBaseObject<Element>): KritzelPoint[] | null {
    // Check if the object is a KritzelShape with a custom clip polygon
    if (KritzelClassHelper.isInstanceOf<KritzelShape>(object, 'KritzelShape')) {
      const shape = object as KritzelShape;
      return shape.getClipPolygon();
    }
    // Path objects use getPathClipPoint instead of polygon
    return null;
  }

  /**
   * Gets the clip point for a Path object by finding the stroke edge intersection.
   * Path objects don't use polygon-based clipping; they use distance-to-stroke calculations.
   * 
   * @param object - The object to check (only processes KritzelPath objects).
   * @param outsidePoint - A reference point outside the path to cast a ray from.
   * @returns The intersection point on the path's stroke edge, or null if not a path or no intersection.
   */
  private getPathClipPoint(object: KritzelBaseObject<Element>, outsidePoint: KritzelPoint): KritzelPoint | null {
    if (KritzelClassHelper.isInstanceOf<KritzelPath>(object, 'KritzelPath')) {
      const path = object as KritzelPath;
      return path.getClipPoint(outsidePoint);
    }
    return null;
  }

  /**
   * Converts local line coordinates to world coordinates.
   * Applies the line's rotation, scale, and translation transformations
   * to convert from internal SVG coordinates to canvas world space.
   * 
   * @param line - The KritzelLine providing transformation context.
   * @param localX - X coordinate in the line's local SVG space.
   * @param localY - Y coordinate in the line's local SVG space.
   * @returns Object with x and y coordinates in world space.
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

    const safeLineScale = this.getSafeScale(line.scale);

    return {
      x: rotatedX / safeLineScale + line.translateX,
      y: rotatedY / safeLineScale + line.translateY,
    };
  }

  /**
   * Converts world coordinates to line's local SVG coordinates.
   * Applies inverse transformations (scale, rotation, translation) to convert
   * from canvas world space to the line's internal SVG coordinate system.
   * 
   * @param line - The KritzelLine providing transformation context.
   * @param worldX - X coordinate in world/canvas space.
   * @param worldY - Y coordinate in world/canvas space.
   * @returns Object with x and y coordinates in the line's local SVG space.
   */
  private lineWorldToLocal(line: KritzelLine, worldX: number, worldY: number): { x: number; y: number } {
    const safeLineScale = this.getSafeScale(line.scale);
    const dx = (worldX - line.translateX) * safeLineScale;
    const dy = (worldY - line.translateY) * safeLineScale;

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

  private getSafeScale(scale: number): number {
    if (Number.isFinite(scale) && Math.abs(scale) > 1e-6) {
      return scale;
    }
    return 1;
  }

  private areFiniteNumbers(...values: Array<number | undefined>): boolean {
    return values.every(value => value !== undefined && Number.isFinite(value));
  }

  private isFiniteAnchorVisualization(visualization: AnchorVisualization | null): visualization is AnchorVisualization {
    if (!visualization) {
      return false;
    }

    if (!this.areFiniteNumbers(visualization.edgeX, visualization.edgeY, visualization.centerX, visualization.centerY)) {
      return false;
    }

    if (visualization.pathD && !this.isFinitePathData(visualization.pathD)) {
      return false;
    }

    return true;
  }

  private isFinitePathData(pathD: string): boolean {
    return !pathD.includes('Infinity') && !pathD.includes('NaN');
  }

  /**
   * Checks whether an object is a group that contains the given object at any depth.
   * @param object - The potential ancestor group.
   * @param descendant - The potential descendant.
   */
  private containsDescendant(object: KritzelBaseObject<Element> | undefined, descendant: KritzelBaseObject<Element>, visited = new Set<string>()): boolean {
    if (!KritzelClassHelper.isInstanceOf<KritzelGroup>(object, 'KritzelGroup') || visited.has(object.id)) {
      return false;
    }
    visited.add(object.id);
    return object.childIds.some(id => id === descendant.id || this.containsDescendant(this._core.store.objects.findById(id), descendant, visited));
  }

  /**
   * Checks if an object can be used as an anchor target.
   * Excludes selection-related objects (SelectionBox, SelectionGroup) and
   * line objects (lines cannot anchor to other lines).
   * 
   * @param object - The object to check for anchorability.
   * @returns True if the object can be anchored to, false otherwise.
   */
  private isAnchorable(object: KritzelBaseObject<Element>): boolean {
    // Exclude selection-related objects
    if (object instanceof KritzelSelectionBox || object instanceof KritzelSelectionGroup) {
      return false;
    }

    // Exclude line objects - lines cannot be anchored to other lines
    if (KritzelClassHelper.isInstanceOf<KritzelLine>(object, 'KritzelLine')) {
      return false;
    }

    // All other visible objects can be anchored to
    return object.isVisible;
  }
}
