import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { KritzelMathHelper } from '../../helpers/math.helper';

/**
 * Configuration options for creating a KritzelGroup instance.
 */
export interface KritzelGroupConfig {
  rotation?: number;
}

/**
 * KritzelGroup represents a permanent grouping of objects that act as a single unit.
 * 
 * Unlike KritzelSelectionGroup (which is ephemeral and used for temporary multi-selection),
 * KritzelGroup is persisted and saved with the workspace. Grouped objects move, resize,
 * rotate, copy, and delete together as one unit.
 * 
 * Key features:
 * - Supports nested groups (groups can contain other groups)
 * - Clicking any child selects the entire group
 * - Can be ungrouped to restore children to top-level objects
 */
export class KritzelGroup extends KritzelBaseObject<HTMLElement> {
    override __class__: string = 'KritzelGroup';

    constructor(config?: KritzelGroupConfig) {
        super();
        this.rotation = KritzelMathHelper.degreesToRadians(config?.rotation ?? 0);
    }

    /**
     * IDs of child objects within this group.
     * Children can be any KritzelBaseObject, including other KritzelGroups for nesting.
     */
    childIds: string[] = [];

    /**
     * Holds child objects that have been added via addChild() before the group
     * is added to the engine. Once the group is added (and _core is set),
     * these are flushed into the store and this array is cleared.
     */
    _pendingChildren: KritzelBaseObject<any>[] = [];

    /**
     * Snapshots of child states for transformation operations (resize, rotate).
     * Similar pattern to KritzelSelectionGroup.
     */
    private unchangedChildSnapshots: Map<string, ChildSnapshot> = new Map();
    private snapshotRotation: number = 0;

    private snapshotTranslateX: number = 0;
    private snapshotTranslateY: number = 0;
    private snapshotTotalWidth: number = 0;
    private snapshotTotalHeight: number = 0;
    private snapshotScale: number = 1;

    /**
     * Retrieves the actual child objects from the store by their IDs.
     * Filters out any IDs that no longer exist in the store.
     * @returns An array of KritzelBaseObject instances representing the group's children.
     */
    get children(): KritzelBaseObject<any>[] {
        if (!this._core) {
            return this._pendingChildren;
        }

        return this.childIds
            .map(id => {
                const found = this._core.store.objects.filter(obj => obj.id === id);
                return found.length > 0 ? found[0] : null;
            })
            .filter((obj): obj is KritzelBaseObject<any> => obj !== null);
    }

    /**
     * Returns the number of children in this group.
     * @returns The count of child IDs stored in this group.
     */
    get length(): number {
        return this.childIds.length;
    }

    /**
     * Factory method to create a new empty KritzelGroup with core integration.
     * Initializes the group with default values and links it to the core store.
     * @param core - The KritzelCore instance providing access to store and state management.
     * @returns A new KritzelGroup instance configured with the core context.
     */
    static override create(core: KritzelCore, config?: { rotation?: number }): KritzelGroup {
        const group = new KritzelGroup(config);

        group._core = core;
        group.id = group.generateId();
        group.workspaceId = core.store.state.activeWorkspace!.id;
        group.userId = core.user?.id;
        group.scale = core.store.state.scale;
        group.zIndex = core.store.currentZIndex;

        return group;
    }

    /**
     * Creates a KritzelGroup from an array of existing objects.
     * The objects are added as children and the group's bounding box is calculated
     * to encompass all children. Child snapshots are captured for transformation operations.
     * @param core - The KritzelCore instance providing access to store and state management.
     * @param objects - An array of KritzelBaseObject instances to group together.
     * @returns A new KritzelGroup containing the specified objects as children.
     */
    static createFromObjects(core: KritzelCore, objects: KritzelBaseObject<any>[]): KritzelGroup {
        const group = KritzelGroup.create(core);

        // Add all objects as children
        objects.forEach(obj => {
            group.childIds.push(obj.id);
        });

        // Calculate bounding box from children
        group.refreshBoundingBox();
        group.captureChildSnapshots();

        return group;
    }

    /**
     * Finds the parent KritzelGroup that contains the given object as a direct child.
     * Searches through all groups in the store to find one containing the specified object ID.
     * @param core - The KritzelCore instance providing access to the object store.
     * @param objectId - The unique identifier of the object to find the parent group for.
     * @returns The parent KritzelGroup if found, or null if the object is not a child of any group.
     */
    static findParentGroup(core: KritzelCore, objectId: string): KritzelGroup | null {
        const allGroups = core.store.objects
            .filter(obj => obj.__class__ === 'KritzelGroup') as KritzelGroup[];

        for (const group of allGroups) {
            if (group.childIds.includes(objectId)) {
                return group;
            }
        }

        return null;
    }

    /**
     * Recursively collects the IDs of all descendants of the given group (children,
     * grandchildren, etc.). Useful for detecting when a selection contains both an
     * ancestor group and one of its descendants — a configuration that would otherwise
     * cause the descendant to be transformed twice (once via the ancestor, once directly).
     * @param group - The group whose descendants should be collected.
     * @param out - A set that will be populated with all descendant object IDs.
     */
    static collectDescendantIds(group: KritzelGroup, out: Set<string> = new Set()): Set<string> {
        for (const child of group.children) {
            out.add(child.id);
            if (child instanceof KritzelGroup) {
                KritzelGroup.collectDescendantIds(child, out);
            }
        }
        return out;
    }

    /**
     * Adds a child object to this group.
     * If the object is already a child, no action is taken.
     * Automatically refreshes the bounding box and captures child snapshots.
     * @param object - The KritzelBaseObject instance to add as a child.
     */
    addChild(object: KritzelBaseObject<any>): void {
        if (!this.childIds.includes(object.id)) {
            this.childIds.push(object.id);

            if (!this._core) {
                this._pendingChildren.push(object);
                return;
            }

            this.refreshBoundingBox();
            this.captureChildSnapshots();
        }
    }

    /**
     * Removes a child object from this group by its ID.
     * If the object is not a child, no action is taken.
     * Automatically refreshes the bounding box and captures child snapshots.
     * @param objectId - The unique identifier of the child object to remove.
     */
    removeChild(objectId: string): void {
        const index = this.childIds.indexOf(objectId);
        if (index !== -1) {
            this.childIds.splice(index, 1);
            this.refreshBoundingBox();
            this.captureChildSnapshots();
        }
    }

    /**
     * Ungroups this group, returning all children to top-level objects.
     * The group itself should be removed from the store after calling this method.
     * @returns An array of all child objects that were part of this group.
     */
    ungroup(): KritzelBaseObject<any>[] {
        return this.children;
    }

    /**
     * Finalizes the group after children have been positioned (e.g., after paste).
     * Refreshes the bounding box to encompass all children and captures
     * child snapshots for subsequent transformation operations.
     *
     * Recursively finalizes nested child groups first, so that when a transform
     * (rotate/resize) cascades through nested groups, every group's snapshots are
     * aligned with the current visual state. Without this, a nested group's
     * `snapshotRotation` could be stale, causing the inner group to be offset
     * relative to its parent during rotation.
     */
    finalize(): void {
        for (const child of this.children) {
            if (child instanceof KritzelGroup) {
                child.finalize();
            }
        }
        this.refreshBoundingBox();
        this.captureChildSnapshots();
    }

    /**
     * Moves the group and all its children to the center of the viewport.
     * Overrides the base implementation to ensure children move with the group.
     */
    override centerInViewport(): void {
        const { viewportWidth, viewportHeight, translateX: viewportTranslateX, translateY: viewportTranslateY, scale: viewportScale } = this._core.store.state;
        const { x, y, width, height } = this.rotatedBoundingBox;

        const objectCenterX = x + width / 2;
        const objectCenterY = y + height / 2;

        const targetCenterX = (viewportWidth / 2 - viewportTranslateX) / viewportScale;
        const targetCenterY = (viewportHeight / 2 - viewportTranslateY) / viewportScale;

        const deltaX = targetCenterX - objectCenterX;
        const deltaY = targetCenterY - objectCenterY;

        this.translateX += deltaX;
        this.translateY += deltaY;

        this.children.forEach(child => {
            child.translateX += deltaX;
            child.translateY += deltaY;
        });

        this.captureChildSnapshots();
    }

    /**
     * Recalculates the group's bounding box based on its children.
     * Handles three cases: empty group (zero dimensions), single child (inherit its bounds),
     * and multiple children (calculate encompassing bounds with rotation support).
     * Updates translateX, translateY, width, and height properties.
     */
    refreshBoundingBox(): void {
        if (this.children.length === 0) {
            this.width = 0;
            this.height = 0;
            this.translateX = 0;
            this.translateY = 0;
            return;
        }

        if (this.children.length === 1) {
            // Single child: inherit its bounding box
            const child = this.children[0];
            this.translateX = child.boundingBox.x;
            this.translateY = child.boundingBox.y;
            this.width = child.boundingBox.width * this.scale;
            this.height = child.boundingBox.height * this.scale;
            return;
        }

        // Multiple children: calculate encompassing bounding box
        const rotation = this.rotation;
        const cos = Math.cos(-rotation);
        const sin = Math.sin(-rotation);

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        this.children.forEach(child => {
            const polygon = child.rotatedPolygon;
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

    /**
     * Captures snapshots of all child states for transformation operations.
     * Stores position, rotation, dimensions, and scale for each child.
     * Also captures the group's current state for relative calculations.
     */
    private captureChildSnapshots(): void {
        this.unchangedChildSnapshots.clear();
        this.snapshotRotation = this.rotation;

        this.snapshotTranslateX = this.translateX;
        this.snapshotTranslateY = this.translateY;
        this.snapshotTotalWidth = this.totalWidth;
        this.snapshotTotalHeight = this.totalHeight;
        this.snapshotScale = this.scale || 1;

        this.children.forEach(child => {
            this.unchangedChildSnapshots.set(child.id, {
                id: child.id,
                translateX: child.translateX,
                translateY: child.translateY,
                rotation: child.rotation,
                width: child.width,
                height: child.height,
                totalWidth: child.totalWidth,
                totalHeight: child.totalHeight,
                scale: child.scale,
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // TRANSFORMATION METHODS
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Moves the group and all its children by the delta between start and end positions.
     * Updates are wrapped in a transaction for atomic persistence.
     * Also updates any lines anchored to child objects.
     * @param startX - The starting x coordinate in screen space.
     * @param startY - The starting y coordinate in screen space.
     * @param endX - The ending x coordinate in screen space.
     * @param endY - The ending y coordinate in screen space.
     */
    override move(startX: number, startY: number, endX: number, endY: number): void {
        const deltaX = (startX - endX) / this._core.store.state.scale;
        const deltaY = (startY - endY) / this._core.store.state.scale;

        this.translateX += deltaX;
        this.translateY += deltaY;

        this._core.store.objects.transaction(() => {
            this._core.store.objects.update(this);

            this.children.forEach(child => {
                child.move(startX, startY, endX, endY);

                // Update any lines anchored to this child
                this._core.anchorManager.updateAnchorsForObject(child.id);
            });
        });

        // Update snapshots
        this.unchangedChildSnapshots.forEach(snapshot => {
            snapshot.translateX += deltaX;
            snapshot.translateY += deltaY;
        });
    }

    /**
     * Resizes the group and proportionally transforms all children.
     * Children are scaled and repositioned relative to the group's center,
     * accounting for rotation. Updates are wrapped in a transaction.
     * @param x - The new x translation coordinate for the group.
     * @param y - The new y translation coordinate for the group.
     * @param width - The new width of the group's content area.
     * @param height - The new height of the group's content area.
     */
    override resize(x: number, y: number, width: number, height: number): void {
        // Use snapshot dimensions (stable across the gesture) instead of `this.*`,
        // which mutates each frame and gets distorted by descendants like KritzelText
        // that clamp to a uniform scale, causing the cascade factor to drift.
        const baseWidth = this.snapshotTotalWidth > 0
            ? this.snapshotTotalWidth - this.padding * 2
            : this.width;
        const baseHeight = this.snapshotTotalHeight > 0
            ? this.snapshotTotalHeight - this.padding * 2
            : this.height;
        const baseScale = this.snapshotScale || this.scale || 1;

        const widthScaleFactor = baseWidth !== 0 ? width / baseWidth : 1;
        const heightScaleFactor = baseHeight !== 0 ? height / baseHeight : 1;

        // Calculate old center from snapshot (stable across the gesture)
        const snapshotTotalWidth = this.snapshotTotalWidth || (this.width + this.padding * 2);
        const snapshotTotalHeight = this.snapshotTotalHeight || (this.height + this.padding * 2);
        const oldCenterX = this.snapshotTranslateX + snapshotTotalWidth / 2 / baseScale;
        const oldCenterY = this.snapshotTranslateY + snapshotTotalHeight / 2 / baseScale;

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
            this.children.forEach(child => {
                // Use snapshot values for the child to avoid compounding distortions caused
                // by descendants like text that cannot honour requested aspect ratios.
                const snapshot = this.unchangedChildSnapshots.get(child.id);
                const childTranslateX = snapshot ? snapshot.translateX : child.translateX;
                const childTranslateY = snapshot ? snapshot.translateY : child.translateY;
                const childTotalWidth = snapshot ? snapshot.totalWidth : child.totalWidth;
                const childTotalHeight = snapshot ? snapshot.totalHeight : child.totalHeight;
                const childWidth = snapshot ? snapshot.width : child.width;
                const childHeight = snapshot ? snapshot.height : child.height;
                const childRotation = snapshot ? snapshot.rotation : child.rotation;
                const childScale = (snapshot ? snapshot.scale : child.scale) || 1;

                // Calculate child center from snapshot
                const childCenterX = childTranslateX + childTotalWidth / 2 / childScale;
                const childCenterY = childTranslateY + childTotalHeight / 2 / childScale;

                // Vector from old group center to child center
                const dx = childCenterX - oldCenterX;
                const dy = childCenterY - oldCenterY;

                // Rotate to local space
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

                // Calculate relative rotation for scaling
                const relativeRotation = childRotation - rotation;
                const cosRel = Math.cos(relativeRotation);
                const sinRel = Math.sin(relativeRotation);

                const newChildWidthScale = Math.sqrt(
                    Math.pow(widthScaleFactor * cosRel, 2) + Math.pow(heightScaleFactor * sinRel, 2)
                );
                const newChildHeightScale = Math.sqrt(
                    Math.pow(widthScaleFactor * sinRel, 2) + Math.pow(heightScaleFactor * cosRel, 2)
                );

                const updatedWidth = childWidth * newChildWidthScale;
                const updatedHeight = childHeight * newChildHeightScale;
                const updatedTotalWidth = updatedWidth + child.padding * 2;
                const updatedTotalHeight = updatedHeight + child.padding * 2;

                const updatedX = newChildCenterX - updatedTotalWidth / 2 / child.scale;
                const updatedY = newChildCenterY - updatedTotalHeight / 2 / child.scale;

                child.resize(updatedX, updatedY, updatedWidth, updatedHeight);

                // Update anchored lines
                this._core.anchorManager.updateAnchorsForObject(child.id);
            });

            this.refreshBoundingBox();

            // Don't recapture snapshots while an interactive resize is in progress —
            // recapturing each frame would defeat the purpose of using stable snapshots
            // and re-introduce the compounding distortion described above. Snapshots are
            // refreshed at the start of the next gesture via beginTransform/finalize.
            if (!this._core.store.state.isResizing) {
                this.captureChildSnapshots();
            }

            this._core.store.objects.update(this);
        });
    }

    /**
     * Rotates the group and all its children around the group's center.
     * Children maintain their relative positions and are individually rotated.
     * Uses captured snapshots to calculate rotation deltas.
     * @param value - The new absolute rotation angle in radians.
     */
    override rotate(value: number): void {
        this.rotation = value;

        const centerX = this.translateX + this.totalWidth / 2 / this.scale;
        const centerY = this.translateY + this.totalHeight / 2 / this.scale;

        const angle = value - this.snapshotRotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        this._core.store.objects.transaction(() => {
            this._core.store.objects.update(this);

            this.children.forEach(child => {
                const unchangedSnapshot = this.unchangedChildSnapshots.get(child.id);
                if (!unchangedSnapshot) return;

                const offsetX = this.getOffsetXToCenterFromSnapshot(unchangedSnapshot);
                const offsetY = this.getOffsetYToCenterFromSnapshot(unchangedSnapshot);

                const rotatedX = cos * offsetX - sin * offsetY;
                const rotatedY = sin * offsetX + cos * offsetY;

                child.translateX = centerX + rotatedX - child.totalWidth / 2 / child.scale;
                child.translateY = centerY + rotatedY - child.totalHeight / 2 / child.scale;

                child.rotate(this.children.length === 1 ? value : unchangedSnapshot.rotation + angle);
            });
        });
    }

    /**
     * Calculates the horizontal offset from the group's center to a child's center
     * using the captured snapshot values.
     * @param snapshot - The captured state of the child object.
     * @returns The x-axis offset from the group center to the child center.
     */
    private getOffsetXToCenterFromSnapshot(snapshot: ChildSnapshot): number {
        const childCenterX = snapshot.translateX + snapshot.totalWidth / snapshot.scale / 2;
        const groupScale = this.snapshotScale || this.scale || 1;
        const groupCenterX = this.snapshotTranslateX + this.snapshotTotalWidth / groupScale / 2;
        return childCenterX - groupCenterX;
    }

    /**
     * Calculates the vertical offset from the group's center to a child's center
     * using the captured snapshot values.
     * @param snapshot - The captured state of the child object.
     * @returns The y-axis offset from the group center to the child center.
     */
    private getOffsetYToCenterFromSnapshot(snapshot: ChildSnapshot): number {
        const childCenterY = snapshot.translateY + snapshot.totalHeight / snapshot.scale / 2;
        const groupScale = this.snapshotScale || this.scale || 1;
        const groupCenterY = this.snapshotTranslateY + this.snapshotTotalHeight / groupScale / 2;
        return childCenterY - groupCenterY;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HIT TESTING
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Tests if a point lies within any of the group's children.
     * The group is considered hit if any child passes the hit test.
     * @param x - The x coordinate to test in world space.
     * @param y - The y coordinate to test in world space.
     * @returns True if the point is inside any child, false otherwise.
     */
    override hitTest(x: number, y: number): boolean {
        // Check if point is inside any child
        return this.children.some(child => child.hitTest(x, y));
    }

    /**
     * Tests if a polygon intersects with any of the group's children.
     * Used for lasso selection and area-based hit detection.
     * @param polygon - The polygon to test intersection against.
     * @returns True if the polygon intersects any child, false otherwise.
     */
    override hitTestPolygon(polygon: KritzelPolygon): boolean {
        // Check if polygon intersects with any child
        return this.children.some(child => child.hitTestPolygon(polygon));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // COPY & SERIALIZATION
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Creates a deep copy of this group and all its children.
     * Children are copied but not added to the store; they are stored
     * in a temporary _pendingChildren property for paste() to handle.
     * @returns A new KritzelGroup with copied children and properties.
     */
    override copy(): KritzelGroup {
        const copiedGroup = KritzelGroup.create(this._core);

        // Deep copy all children but DON'T add to store yet
        // Store the copied children temporarily for paste() to handle
        const copiedChildren: KritzelBaseObject<any>[] = [];

        this.children
            .sort((a, b) => a.zIndex - b.zIndex)
            .forEach(child => {
                const copiedChild = child.copy() as KritzelBaseObject<any>;
                copiedChildren.push(copiedChild);
                copiedGroup.childIds.push(copiedChild.id);
            });

        // Store copied children on the group for paste() to handle
        copiedGroup._pendingChildren = copiedChildren;

        // Copy group properties
        copiedGroup.rotation = this.rotation;
        copiedGroup.translateX = this.translateX;
        copiedGroup.translateY = this.translateY;
        copiedGroup.width = this.width;
        copiedGroup.height = this.height;

        return copiedGroup;
    }

    /**
     * Serializes the group to a plain object for persistence.
     * Excludes runtime references (_core, _elementRef, element) and
     * converts the unchangedChildSnapshots Map to a plain object.
     * @returns A serializable plain object representation of this group.
     */
    override serialize() {
        const { _core, _elementRef, element, totalWidth, totalHeight, unchangedChildSnapshots, _pendingChildren, ...remainingProps } = this as any;

        const clonedProps = structuredClone(remainingProps);

        // Convert Map to plain object for serialization
        clonedProps.unchangedChildSnapshots = Object.fromEntries(this.unchangedChildSnapshots);

        return clonedProps;
    }

    /**
     * Deserializes a plain object back into this KritzelGroup instance.
     * Restores the unchangedChildSnapshots Map from the serialized object format.
     * @param object - The serialized plain object containing group data.
     * @returns This group instance after deserialization, cast to type T.
     */
    override deserialize<T>(object: any): T {
        super.deserialize(object);

        // Restore the Map from serialized object
        if (object.unchangedChildSnapshots) {
            this.unchangedChildSnapshots = new Map(Object.entries(object.unchangedChildSnapshots));
        }

        return this as unknown as T;
    }

    /**
     * Persists the current state of this group to the store.
     * Triggers synchronization with y.js for collaborative editing.
     */
    override update(): void {
        this._core.store.objects.update(this);
    }

    /**
     * Updates the workspace ID for this group and all its children recursively.
     * Handles nested groups by recursively calling this method on child groups.
     * @param workspaceId - The new workspace ID to assign to this group and its children.
     */
    updateWorkspaceId(workspaceId: string): void {
        this.workspaceId = workspaceId;
        this.children.forEach(child => {
            child.workspaceId = workspaceId;
            // Recursively update nested groups
            if (KritzelClassHelper.isInstanceOf<KritzelGroup>(child, 'KritzelGroup')) {
                child.updateWorkspaceId(workspaceId);
            }
        });
    }
}

/**
 * Snapshot of a child object's state for transformation operations.
 */
interface ChildSnapshot {
    id: string;
    translateX: number;
    translateY: number;
    rotation: number;
    width: number;
    height: number;
    totalWidth: number;
    totalHeight: number;
    scale: number;
}
