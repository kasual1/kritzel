import { KritzelCore } from '../core/core.class';
import { KritzelGeometryHelper } from '../../helpers/geometry.helper';
import { KritzelBaseObject } from './base-object.class';
import { KritzelGroup } from './group.class';
import { ThemeAwareColor } from '../../constants/color-palette.constants';
import { KritzelMathHelper } from '../../helpers/math.helper';
import { KritzelLine } from './line.class';

/**
 * Configuration options for creating a KritzelSelectionGroup instance.
 */
export interface KritzelSelectionGroupConfig {
  rotation?: number;
}

/**
 * Represents a snapshot of an object's transform state at a specific point in time.
 * Used to preserve initial values during transform operations (rotate, resize)
 * to avoid compounding errors from incremental updates.
 */
interface UnchangedObjectSnapshot {
  /** The unique identifier of the object */
  id: string;
  /** The x-translation position of the object */
  translateX: number;
  /** The y-translation position of the object */
  translateY: number;
  /** The rotation angle of the object in radians */
  rotation: number;
  /** The content width of the object (excluding padding) */
  width: number;
  /** The content height of the object (excluding padding) */
  height: number;
  /** The total width of the object (including padding) */
  totalWidth: number;
  /** The total height of the object (including padding) */
  totalHeight: number;
  /** The scale factor applied to the object */
  scale: number;
}

/**
 * Represents a selection group that manages multiple selected objects on the canvas.
 * The selection group allows batch operations like move, resize, and rotate on multiple objects simultaneously.
 * It maintains its own bounding box that encompasses all selected objects.
 */
export class KritzelSelectionGroup extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionGroup';

  constructor(config?: KritzelSelectionGroupConfig) {
    super();
    this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
  }

  // Store only object IDs instead of full objects
  private _objectIds: string[] = [];

  // Cached objects array - invalidated when objectIds changes
  private _cachedObjects: KritzelBaseObject<any>[] | null = null;
  private _cachedObjectIdsHash: string = '';

  // Store snapshots of object state for transformations (rotation, resize)
  unchangedObjectSnapshots: Map<string, UnchangedObjectSnapshot> = new Map();
  snapshotRotation: number = 0;
  snapshotWidth: number = 0;
  snapshotHeight: number = 0;
  snapshotTranslateX: number = 0;
  snapshotTranslateY: number = 0;

  clientId?: number;

  minX: number = 0;
  maxX: number = 0;

  minY: number = 0;
  maxY: number = 0;

  // Selection styling properties
  handleColor?: ThemeAwareColor;
  handleStrokeColor?: ThemeAwareColor;
  handleSize: number = 6;

  /** Timestamp of the last Yjs persist for children during a drag */
  private _lastChildPersistTime: number = 0;
  /** Minimum interval (ms) between child Yjs persists during drag */
  private static readonly CHILD_PERSIST_THROTTLE_MS = 100;
  /** Ignore tiny floating-point diffs when comparing refreshed bounds */
  private static readonly DIMENSION_EPSILON = 0.001;

  /**
   * Gets the array of object IDs contained in this selection group.
   * @returns Array of string IDs for the selected objects
   */
  get objectIds(): string[] {
    return this._objectIds;
  }

  /**
   * Sets the array of object IDs contained in this selection group.
   * Invalidates the cached objects array when changed.
   * @param value - Array of string IDs to set as the selected objects
   */
  set objectIds(value: string[]) {
    this._objectIds = value;
    this._cachedObjects = null; // Invalidate cache
  }

  /**
   * Invalidate the cached objects array. Call this when objects might have changed
   * externally (e.g., after undo/redo operations).
   */
  invalidateObjectsCache(): void {
    this._cachedObjects = null;
  }

  /**
   * Retrieves the actual object instances from the store by their IDs.
   * Uses caching to avoid redundant lookups - only recomputes when objectIds changes.
   * Preserves the original insertion order of objects.
   * @returns Array of KritzelBaseObject instances corresponding to the stored IDs
   */
  get objects(): KritzelBaseObject<any>[] {
    const currentHash = this._objectIds.join(',');
    if (this._cachedObjects !== null && this._cachedObjectIdsHash === currentHash) {
      return this._cachedObjects;
    }

    const idSet = new Set(this._objectIds);
    const foundObjects = this._core.store.objects.filter(obj => idSet.has(obj.id));
    // Preserve the original order from objectIds
    const objectMap = new Map(foundObjects.map(obj => [obj.id, obj]));
    this._cachedObjects = this._objectIds
      .map(id => objectMap.get(id))
      .filter((obj): obj is KritzelBaseObject<any> => obj !== undefined);
    this._cachedObjectIdsHash = currentHash;
    return this._cachedObjects;
  }

  private syncChildSelectionState(children: KritzelBaseObject<any>[]): void {
    const shouldBeSelected = this.isSelected === true;
    for (const child of children) {
      child.isSelected = shouldBeSelected;
    }
  }

  private shouldSyncChildSelectionState(): boolean {
    const localClientId = this._core.store.objects?.localClientId ?? null;
    if (localClientId != null && this.clientId != null) {
      return this.clientId === localClientId;
    }

    const localUserId = this._core.user?.id ?? null;
    if (localUserId != null && this.userId != null) {
      return this.userId === localUserId;
    }

    return this.userId == null;
  }

  /**
   * Gets the number of objects in the selection group.
   * @returns The count of selected objects
   */
  get length(): number {
    return this.objectIds.length;
  }

  /**
   * Factory method to create a new KritzelSelectionGroup instance.
   * Initializes the selection group with default properties and associates it with the core instance.
   * Default styling uses values from the theme system (selection section).
   * @param core - The KritzelCore instance to associate with this selection group
   * @returns A new KritzelSelectionGroup instance configured with default settings
   */
  static override create(core: KritzelCore, config?: { rotation?: number }): KritzelSelectionGroup {
    const object = new KritzelSelectionGroup(config);

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace!.id;
    object.userId = core.user?.id;
    object.clientId = core.store.objects?.localClientId ?? undefined;
    object.scale = core.store.state.scale;
    object.zIndex = 99999;
    
    // Initialize styling with theme-aware defaults
    object.borderColor = undefined;
    object.borderWidth = 2;
    object.handleColor = undefined;
    object.handleStrokeColor = undefined;
    object.handleSize = 6;

    return object;
  }

  /**
   * Adds multiple objects to the selection group.
   * Only adds objects that are not already in the selection.
   * Updates the group's rotation based on the number of selected objects:
   * - Single object: inherits the object's rotation
   * - Multiple objects: resets rotation to 0
   * Refreshes bounding box dimensions after adding objects.
   * @param objects - Array of KritzelBaseObject instances to add to the selection
   */
  addObjects(objects: KritzelBaseObject<any>[]) {
    let changed = false;
    for (const object of objects) {
      if (!this._objectIds.includes(object.id)) {
        this._objectIds.push(object.id);
        object.isSelected = true;
        changed = true;
      }
    }

    if (changed) {
      this._cachedObjects = null;
      const children = this.objects;
      if (children.length === 1) {
        this.rotation = children[0].rotation;
      } else if (children.length > 1) {
        this.rotation = 0;
      }
      this.captureUnchangedSnapshots(children);
      this.refreshObjectDimensions(children);
    }
  }

  /**
   * Toggles an object's presence in the selection group.
   * If the object is already selected, it will be removed.
   * If the object is not selected, it will be added.
   * Updates group rotation and refreshes bounding box dimensions after the change.
   * @param object - The KritzelBaseObject instance to toggle in the selection
   */
  addOrRemove(object: KritzelBaseObject<any>) {
    const index = this._objectIds.findIndex(id => id === object.id);
    if (index === -1) {
      this._objectIds.push(object.id);
      object.isSelected = true;
    } else {
      this._objectIds.splice(index, 1);
      object.isSelected = false;
    }
    this._cachedObjects = null; // Invalidate cache

    const children = this.objects; // Get cached objects once
    if (children.length === 1) {
      this.rotation = children[0].rotation;
    } else if (children.length > 1) {
      this.rotation = 0;
    }
    this.captureUnchangedSnapshots(children);
    this.refreshObjectDimensions(children);
  }

  /**
   * Prepares the selection group and its children for a transform interaction (rotate/resize).
   * Ensures snapshot state is aligned with the current visual state.
   */
  beginTransform(): void {
    const children = this.objects; // Get cached objects once

    // Keep the selection group's bounding box current before snapshotting.
    this.refreshObjectDimensions(children);
    this.captureUnchangedSnapshots(children);

    // Groups need their own child snapshots aligned with the current transform.
    for (const obj of children) {
      if (obj instanceof KritzelGroup) {
        obj.finalize();
      }
    }
  }

  /**
   * Sets the isSelected flag to false for all objects in the selection group.
   * Used when clearing or changing the selection state.
   *
   * For KritzelGroup members, also clears the isSelected flag on all nested
   * descendants. A descendant can retain a lingering isSelected from the marquee
   * preview before it was resolved to its parent group during selection, which
   * would otherwise leave that object selected after the group is deselected and
   * cause the whole group to be re-selected on the next interaction.
   */
  deselectAllChildren() {
    const children = this.objects;
    const descendantIds = new Set<string>();
    for (const obj of children) {
      obj.isSelected = false;
      if (obj instanceof KritzelGroup) {
        KritzelGroup.collectDescendantIds(obj as KritzelGroup, descendantIds);
      }
    }

    if (descendantIds.size > 0) {
      const descendants = this._core.store.objects.filter(o => descendantIds.has(o.id));
      for (const descendant of descendants) {
        descendant.isSelected = false;
      }
    }
  }

  /**
   * Updates the workspace ID for the selection group and all its contained objects.
   * Used when moving objects between workspaces or updating workspace associations.
   * @param workspaceId - The new workspace ID to assign to the group and its children
   */
  updateWorkspaceId(workspaceId: string) {
    this.workspaceId = workspaceId;
    const children = this.objects;
    for (const obj of children) {
      obj.workspaceId = workspaceId;
    }
  }

  /**
   * Updates the z-index values for all objects in the selection group.
   * Assigns sequential z-indices starting from the provided value.
   * @param startZIndex - The starting z-index value; subsequent objects get startZIndex + 1, startZIndex + 2, etc.
   */
  updateZIndices(startZIndex: number) {
    const children = this.objects;
    for (let i = 0; i < children.length; i++) {
      children[i].zIndex = startZIndex + i;
    }
  }

  /**
   * Updates the absolute position of the selection group and all its contained objects.
   * Maintains the relative positions of child objects within the group.
   * Also updates the unchangedObjectSnapshots to reflect the new positions.
   * @param x - The new x-coordinate for the selection group's top-left corner
   * @param y - The new y-coordinate for the selection group's top-left corner
   */
  updatePosition(x: number, y: number) {
    const children = this.objects;
    for (const obj of children) {
      const deltaX = obj.translateX - this.translateX;
      const deltaY = obj.translateY - this.translateY;
      obj.updatePosition(x + deltaX, y + deltaY);
    }

    // Update snapshots
    this.unchangedObjectSnapshots.forEach(snapshot => {
      const deltaX = snapshot.translateX - this.translateX;
      const deltaY = snapshot.translateY - this.translateY;
      snapshot.translateX = x + deltaX;
      snapshot.translateY = y + deltaY;
    });

    this.translateX = x;
    this.translateY = y;

    this._core.store.objects.update(this);
  }

  /**
   * Capture snapshots of current object states for undo/redo operations
   * @param cachedObjects Optional pre-fetched objects array to avoid redundant getter calls
   */
  captureUnchangedSnapshots(cachedObjects?: KritzelBaseObject<any>[]): void {
    this.unchangedObjectSnapshots.clear();
    this.snapshotRotation = this.rotation;
    this.snapshotWidth = this.width;
    this.snapshotHeight = this.height;
    this.snapshotTranslateX = this.translateX;
    this.snapshotTranslateY = this.translateY;
    const children = cachedObjects ?? this.objects;
    children.forEach(obj => {
      this.unchangedObjectSnapshots.set(obj.id, {
        id: obj.id,
        translateX: obj.translateX,
        translateY: obj.translateY,
        rotation: obj.rotation,
        width: obj.width,
        height: obj.height,
        totalWidth: obj.totalWidth,
        totalHeight: obj.totalHeight,
        scale: obj.scale,
      });
    });
  }

  /**
   * Serializes the selection group to a plain object for persistence or transmission.
   * Excludes internal references like _core, element refs, and cached data.
   * Converts the unchangedObjectSnapshots Map to a plain object for JSON compatibility.
   * @returns A serializable object representation of the selection group
   */
  override serialize() {
    const { _core, _elementRef, element, totalWidth, totalHeight, unchangedObjectSnapshots, _cachedObjects, _cachedObjectIdsHash, snapshotWidth, snapshotHeight, snapshotTranslateX, snapshotTranslateY, snapshotRotation, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    // Ensure objectIds is serialized with the correct key name (getter returns _objectIds)
    clonedProps.objectIds = this.objectIds;
    delete clonedProps._objectIds;

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    // Convert Map to plain object for serialization
    clonedProps.unchangedObjectSnapshots = Object.fromEntries(this.unchangedObjectSnapshots);

    return clonedProps;
  }

  /**
   * Deserializes a plain object back into a KritzelSelectionGroup instance.
   * Restores objectIds through the setter and reconstructs the unchangedObjectSnapshots Map.
   * @template T - The return type for the deserialized object
   * @param object - The serialized object containing the selection group data
   * @returns The deserialized selection group instance cast to type T
   */
  override deserialize<T>(object: any): T {
    // First, deserialize all base properties using parent's deserialize
    super.deserialize(object);

    // Selection groups intentionally persist their selected state.
    this.isSelected = object.isSelected === true;

    // Restore objectIds through setter
    if (object.objectIds) {
      this.objectIds = object.objectIds;
    }

    // Restore the Map from serialized object
    if (object.unchangedObjectSnapshots) {
      this.unchangedObjectSnapshots = new Map(Object.entries(object.unchangedObjectSnapshots));
    }

    if (this.shouldSyncChildSelectionState()) {
      this.syncChildSelectionState(this.objects);
    }

    return this as unknown as T;
  }

  /**
   * Persists the selection group's current state to the store.
   * Only updates the selection group itself, not child objects.
   * Child objects are updated during their respective move/resize/rotate operations
   * to avoid redundant Yjs updates.
   */
  override update(): void {
    // Only update the selection group itself
    // Child objects are already updated during move/resize/rotate operations
    // Updating them again here would create redundant y.js updates
    this._core.store.objects.update(this);
  }

  /**
   * Moves the selection group and all its contained objects by calculating the delta from drag coordinates.
   * Updates anchor points for any lines connected to the moved objects.
   *
   * Child objects are moved locally without writing to Yjs during the drag to avoid
   * N+1 full serializations per frame, which can overwhelm the WebSocket server.
   * Children must be persisted at drag end via {@link persistChildren}.
   *
   * @param startX - The starting x-coordinate of the drag operation (in screen space)
   * @param startY - The starting y-coordinate of the drag operation (in screen space)
   * @param endX - The ending x-coordinate of the drag operation (in screen space)
   * @param endY - The ending y-coordinate of the drag operation (in screen space)
   */
  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    const now = Date.now();
    const shouldPersistChildren = now - this._lastChildPersistTime >= KritzelSelectionGroup.CHILD_PERSIST_THROTTLE_MS;

    if (shouldPersistChildren) {
      // Periodically persist children to Yjs so remote peers see movement in real-time
      this._core.store.objects.transaction(() => {
        this._core.store.objects.update(this);

        const children = this.objects;
        for (const obj of children) {
          obj.move(startX, startY, endX, endY);
          this._core.anchorManager.updateAnchorsForObject(obj.id);
        }
      });
      this._lastChildPersistTime = now;
    } else {
      // Between throttle intervals, only persist the selection group itself.
      // Children are moved locally for smooth local rendering.
      this._core.store.objects.update(this);

      this._core.store.objects.withLocalUpdatesOnly(() => {
        const children = this.objects;
        for (const obj of children) {
          obj.move(startX, startY, endX, endY);
          this._core.anchorManager.updateAnchorsForObject(obj.id);
        }
      });
    }

    // Update snapshots
    this.unchangedObjectSnapshots.forEach(snapshot => {
      snapshot.translateX += deltaX;
      snapshot.translateY += deltaY;
    });
  }

  /**
   * Persists all child objects to Yjs in a single transaction.
   * Must be called after a drag operation completes to sync the final
   * positions of children that were only updated locally during the drag.
   */
  persistChildren(): void {
    this._core.store.objects.transaction(() => {
      const children = this.objects;
      for (const obj of children) {
        this._core.store.objects.update(obj);
      }
    });
  }

  /**
   * Returns true when the selection contains a line anchored to an object
   * that is not part of this selection group.
   */
  hasExternalAnchoredLineConnections(cachedObjects?: KritzelBaseObject<any>[]): boolean {
    const children = cachedObjects ?? this.objects;
    if (children.length === 0) {
      return false;
    }

    const selectedIds = new Set(children.map(child => child.id));

    for (const child of children) {
      if (!(child instanceof KritzelLine)) {
        continue;
      }

      const line = child as KritzelLine;
      if (line.startAnchor && !selectedIds.has(line.startAnchor.objectId)) {
        return true;
      }

      if (line.endAnchor && !selectedIds.has(line.endAnchor.objectId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resizes the selection group and scales all contained objects proportionally.
   * Uses snapshot values to avoid compounding errors during continuous drag operations.
   * Handles rotation by transforming coordinates into and out of the group's local space.
   * Updates anchor points for any lines connected to resized objects.
   * @param x - The new x-coordinate for the selection group's position
   * @param y - The new y-coordinate for the selection group's position
   * @param width - The new width for the selection group
   * @param height - The new height for the selection group
   */
  override resize(x: number, y: number, width: number, height: number): void {
    // Use snapshot dimensions for scale factor calculation to avoid compounding errors during drag
    const widthScaleFactor = width / this.snapshotWidth;
    const heightScaleFactor = height / this.snapshotHeight;

    // Calculate old center from snapshot position
    const snapshotTotalWidth = this.snapshotWidth + this.padding * 2;
    const snapshotTotalHeight = this.snapshotHeight + this.padding * 2;
    const oldCenterX = this.snapshotTranslateX + snapshotTotalWidth / 2 / this.scale;
    const oldCenterY = this.snapshotTranslateY + snapshotTotalHeight / 2 / this.scale;

    // Calculate new center
    const newTotalWidth = width + this.padding * 2;
    const newTotalHeight = height + this.padding * 2;
    const newCenterX = x + newTotalWidth / 2 / this.scale;
    const newCenterY = y + newTotalHeight / 2 / this.scale;

    const rotation = this.rotation;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);

    this._core.store.objects.transaction(() => {
      // Cache objects once to avoid repeated getter calls during resize
      const children = this.objects;

      children.forEach(child => {
        // Use snapshot values for child to avoid compounding errors during drag
        const snapshot = this.unchangedObjectSnapshots.get(child.id);
        if (!snapshot) return;

        // Calculate child center from snapshot position
        const childCenterX = snapshot.translateX + snapshot.totalWidth / 2 / snapshot.scale;
        const childCenterY = snapshot.translateY + snapshot.totalHeight / 2 / snapshot.scale;

        // Vector from old group center to child center
        const dx = childCenterX - oldCenterX;
        const dy = childCenterY - oldCenterY;

        // Rotate to local space (align with group axes)
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Scale in local space
        const scaledLocalX = localX * widthScaleFactor;
        const scaledLocalY = localY * heightScaleFactor;

        // Rotate back to world space
        const rotatedX = scaledLocalX * cosR - scaledLocalY * sinR;
        const rotatedY = scaledLocalX * sinR + scaledLocalY * cosR;

        // New child center
        const newChildCenterX = newCenterX + rotatedX;
        const newChildCenterY = newCenterY + rotatedY;

        // New child top-left
        // Calculate relative rotation using snapshot rotation
        const relativeRotation = snapshot.rotation - rotation;
        const cosRel = Math.cos(relativeRotation);
        const sinRel = Math.sin(relativeRotation);

        // Project the group's scale factors onto the child's local axes
        // We use absolute values because scaling is magnitude-based
        // If the child is aligned (0 deg), cos=1, sin=0 -> scales match
        // If the child is 90 deg, cos=0, sin=1 -> scales swap
        const newChildWidthScale = Math.sqrt(
          Math.pow(widthScaleFactor * cosRel, 2) + Math.pow(heightScaleFactor * sinRel, 2)
        );
        const newChildHeightScale = Math.sqrt(
          Math.pow(widthScaleFactor * sinRel, 2) + Math.pow(heightScaleFactor * cosRel, 2)
        );

        // Use snapshot dimensions to calculate new size, avoiding compounding errors
        const updatedWidth = snapshot.width * newChildWidthScale;
        const updatedHeight = snapshot.height * newChildHeightScale;
        const updatedTotalWidth = updatedWidth + child.padding * 2;
        const updatedTotalHeight = updatedHeight + child.padding * 2;

        const updatedX = newChildCenterX - updatedTotalWidth / 2 / child.scale;
        const updatedY = newChildCenterY - updatedTotalHeight / 2 / child.scale;

        child.resize(updatedX, updatedY, updatedWidth, updatedHeight);

        // Update any lines that are anchored to this child object
        this._core.anchorManager.updateAnchorsForObject(child.id);
      });

      // Refresh dimensions and update the SelectionGroup to propagate changes to other tabs
      // Note: Don't capture new snapshots here - we need to preserve the original snapshots
      // until the transform operation is complete to avoid compounding errors during drag
      this.refreshObjectDimensions(children);
      this._core.store.objects.update(this);
    });
  }

  /**
   * Rotates the selection group and all contained objects around the group's center.
   * Objects rotate around the group center while also adjusting their individual rotations.
   * Uses snapshot values to calculate incremental rotation from the initial state.
   * @param value - The new rotation angle in radians for the selection group
   */
  override rotate(value: number): void {
    this.rotation = value;

    // Use the snapshot center as the rotation pivot rather than the live center.
    // refreshObjectDimensions() below can grow the box when an anchored line is pinned
    // to an external object; keeping the pivot fixed prevents the children from drifting.
    const snapshotTotalWidth = this.snapshotWidth + this.padding * 2;
    const snapshotTotalHeight = this.snapshotHeight + this.padding * 2;
    const centerX = this.snapshotTranslateX + snapshotTotalWidth / 2 / this.scale;
    const centerY = this.snapshotTranslateY + snapshotTotalHeight / 2 / this.scale;

    const angle = value - this.snapshotRotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Cache objects once to avoid repeated getter calls during rotation
    const children = this.objects;

    this._core.store.objects.transaction(() => {
      // Update the SelectionGroup itself to propagate rotation to other tabs
      this._core.store.objects.update(this);

      const childCount = children.length;
      for (const child of children) {
        const unchangedSnapshot = this.unchangedObjectSnapshots.get(child.id);
        if (!unchangedSnapshot) continue;

        const offsetX = this.getOffsetXToCenterFromSnapshot(unchangedSnapshot);
        const offsetY = this.getOffsetYToCenterFromSnapshot(unchangedSnapshot);

        const rotatedX = cos * offsetX - sin * offsetY;
        const rotatedY = sin * offsetX + cos * offsetY;

        child.translateX = centerX + rotatedX - child.totalWidth / 2 / child.scale;
        child.translateY = centerY + rotatedY - child.totalHeight / 2 / child.scale;

        child.rotate(childCount === 1 ? value : unchangedSnapshot.rotation + angle);
      }

      // Re-sync any anchored lines so their stored geometry follows the rotated objects
      // (including lines anchored to an object outside this selection), then grow the
      // selection box to enclose the reshaped lines. Rotation sets state.isRotating
      // rather than state.isDragging, so the refresh must be triggered explicitly here.
      const anchorTargetIds = new Set<string>();
      for (const child of children) {
        anchorTargetIds.add(child.id);
        if (child instanceof KritzelLine) {
          const line = child as KritzelLine;
          if (line.startAnchor) anchorTargetIds.add(line.startAnchor.objectId);
          if (line.endAnchor) anchorTargetIds.add(line.endAnchor.objectId);
        }
      }

      let hasAnchoredLines = false;
      for (const targetId of anchorTargetIds) {
        if (this._core.anchorManager.getLinesAnchoredTo(targetId).length > 0) {
          hasAnchoredLines = true;
          this._core.anchorManager.updateAnchorsForObject(targetId);
        }
      }

      if (hasAnchoredLines) {
        this.refreshObjectDimensions(children);
      }
    });
  }

  /**
   * Creates a deep copy of the selection group including copies of all contained objects.
   * Preserves z-index ordering by sorting children before copying.
   * Copies maintain their relative positions within the new selection group.
   * @returns A new KritzelSelectionGroup with copies of all contained objects
   */
  override copy(): KritzelBaseObject<HTMLElement> {
    const selectionGroup = KritzelSelectionGroup.create(this._core);
    const children = this.objects;

    // Sort children by zIndex and copy them
    const sortedChildren = [...children].sort((a, b) => a.zIndex - b.zIndex);
    for (const obj of sortedChildren) {
      const copiedObject = obj.copy() as KritzelBaseObject<any>;
      selectionGroup.addOrRemove(copiedObject);
    }

    selectionGroup.captureUnchangedSnapshots();

    if (children.length === 1) {
      selectionGroup.rotation = children[0].rotation;
    }

    return selectionGroup;
  }

  /**
   * Refreshes the selection group's bounding box dimensions based on contained objects.
   * @param cachedObjects Optional pre-fetched objects array to avoid redundant getter calls
   * @param skipPersist If true, only updates local state without persisting to Yjs (used during undo/redo)
   */
  refreshObjectDimensions(cachedObjects?: KritzelBaseObject<any>[], skipPersist: boolean = false): boolean {
    const previous = {
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY,
      width: this.width,
      height: this.height,
      translateX: this.translateX,
      translateY: this.translateY,
    };

    const children = cachedObjects ?? this.objects;
    if (children.length === 1) {
      const obj = children[0];
      this.minX = obj.boundingBox.x / this.scale;
      this.maxX = obj.boundingBox.x / this.scale + obj.boundingBox.width;
      this.minY = obj.boundingBox.y / this.scale;
      this.maxY = obj.boundingBox.y / this.scale + obj.boundingBox.height;

      this.translateX = (this.minX - this.padding) * this.scale;
      this.translateY = (this.minY - this.padding) * this.scale;

      this.width = (this.maxX - this.minX - this.padding) * this.scale;
      this.height = (this.maxY - this.minY - this.padding) * this.scale;
    } else {
      const rotation = this.rotation;
      const cos = Math.cos(-rotation);
      const sin = Math.sin(-rotation);

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      children.forEach(obj => {
        const polygon = obj.rotatedPolygon;
        const corners = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];

        corners.forEach(corner => {
          // Rotate corner into local space (aligned with group rotation)
          const rx = corner.x * cos - corner.y * sin;
          const ry = corner.x * sin + corner.y * cos;

          if (rx < minX) minX = rx;
          if (rx > maxX) maxX = rx;
          if (ry < minY) minY = ry;
          if (ry > maxY) maxY = ry;
        });
      });

      // Dimensions in world units (unrotated)
      const worldWidth = maxX - minX;
      const worldHeight = maxY - minY;

      this.width = (worldWidth - this.padding) * this.scale;
      this.height = (worldHeight - this.padding) * this.scale;

      // Center of the box in rotated space
      const cRx = (minX + maxX) / 2;
      const cRy = (minY + maxY) / 2;

      // Rotate center back to world space
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      const cx = cRx * cosR - cRy * sinR;
      const cy = cRx * sinR + cRy * cosR;

      this.translateX = cx - (this.width / this.scale + 2 * this.padding) / 2;
      this.translateY = cy - (this.height / this.scale + 2 * this.padding) / 2;
    }

    const hasChanged =
      Math.abs(this.minX - previous.minX) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.minY - previous.minY) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.maxX - previous.maxX) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.maxY - previous.maxY) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.width - previous.width) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.height - previous.height) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.translateX - previous.translateX) > KritzelSelectionGroup.DIMENSION_EPSILON ||
      Math.abs(this.translateY - previous.translateY) > KritzelSelectionGroup.DIMENSION_EPSILON;

    if (!skipPersist && hasChanged) {
      this._core.store.objects.update(this);
    }

    return hasChanged;
  }

  /**
   * Calculates the horizontal offset from the group's center to an object's center using snapshot data.
   * Used during rotation to maintain relative positioning of objects.
   * @param snapshot - The snapshot containing the object's recorded position and dimensions
   * @returns The x-axis offset from the group center to the object center
   */
  private getOffsetXToCenterFromSnapshot(snapshot: UnchangedObjectSnapshot): number {
    const objCenterX = snapshot.translateX + snapshot.totalWidth / snapshot.scale / 2;
    const groupCenterX = this.snapshotTranslateX + (this.snapshotWidth + this.padding * 2) / this.scale / 2;
    return objCenterX - groupCenterX;
  }

  /**
   * Calculates the vertical offset from the group's center to an object's center using snapshot data.
   * Used during rotation to maintain relative positioning of objects.
   * @param snapshot - The snapshot containing the object's recorded position and dimensions
   * @returns The y-axis offset from the group center to the object center
   */
  private getOffsetYToCenterFromSnapshot(snapshot: UnchangedObjectSnapshot): number {
    const objCenterY = snapshot.translateY + snapshot.totalHeight / snapshot.scale / 2;
    const groupCenterY = this.snapshotTranslateY + (this.snapshotHeight + this.padding * 2) / this.scale / 2;
    return objCenterY - groupCenterY;
  }

  /**
   * Tests whether a point intersects with the selection group or any of its contained objects.
   * For a single line object, delegates hit testing to the line's own hit test (more precise).
   * For other cases, first checks the group's rotated polygon bounding box, then individual objects.
   * @param x - The x-coordinate of the point to test (in world space)
   * @param y - The y-coordinate of the point to test (in world space)
   * @returns True if the point is inside the selection group or any contained object, false otherwise
   */
  override hitTest(x: number, y: number): boolean {
    const children = this.objects;
    const isSingleLine = children.length === 1 && children[0].__class__ === 'KritzelLine';
    if (isSingleLine) {
      return children[0].hitTest(x, y);
    }

    const polygon = this.rotatedPolygon;
    const polyPoints = [polygon.topLeft, polygon.topRight, polygon.bottomRight, polygon.bottomLeft];
    if (KritzelGeometryHelper.isPointInPolygon({ x, y }, polyPoints)) {
      return true;
    }

    for (const obj of children) {
      if (obj.hitTest(x, y)) {
        return true;
      }
    }
    return false;
  }
}
