import { AnchorIndexEntry, LineAnchor, SnapCandidate, SnapTarget } from '../../interfaces/anchor.interface';
import { KritzelCore } from '../core/core.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';

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
