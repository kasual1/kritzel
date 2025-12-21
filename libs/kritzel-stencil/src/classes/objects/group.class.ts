import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';
import { KritzelPolygon } from '../../interfaces/polygon.interface';

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

    /**
     * IDs of child objects within this group.
     * Children can be any KritzelBaseObject, including other KritzelGroups for nesting.
     */
    childIds: string[] = [];

    /**
     * Snapshots of child states for transformation operations (resize, rotate).
     * Similar pattern to KritzelSelectionGroup.
     */
    private unchangedChildSnapshots: Map<string, ChildSnapshot> = new Map();
    private snapshotRotation: number = 0;

    /**
     * Retrieves the actual child objects from the store by their IDs.
     */
    get children(): KritzelBaseObject<any>[] {
        return this.childIds
            .map(id => {
                const found = this._core.store.state.objects.filter(obj => obj.id === id);
                return found.length > 0 ? found[0] : null;
            })
            .filter((obj): obj is KritzelBaseObject<any> => obj !== null);
    }

    /**
     * Returns the number of children in this group.
     */
    get length(): number {
        return this.childIds.length;
    }

    /**
     * Creates a new empty KritzelGroup.
     */
    static override create(core: KritzelCore): KritzelGroup {
        const group = new KritzelGroup();

        group._core = core;
        group.id = group.generateId();
        group.workspaceId = core.store.state.activeWorkspace.id;
        group.scale = core.store.state.scale;
        group.zIndex = core.store.currentZIndex;

        return group;
    }

    /**
     * Creates a KritzelGroup from an array of objects.
     * The objects are added as children and their bounding box is calculated.
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
     * Finds the parent KritzelGroup that contains the given object as a child.
     * Returns null if the object is not a child of any group.
     */
    static findParentGroup(core: KritzelCore, objectId: string): KritzelGroup | null {
        const allGroups = core.store.state.objects
            .filter(obj => obj.__class__ === 'KritzelGroup') as KritzelGroup[];

        for (const group of allGroups) {
            if (group.childIds.includes(objectId)) {
                return group;
            }
        }

        return null;
    }

    /**
     * Adds a child object to this group.
     */
    addChild(object: KritzelBaseObject<any>): void {
        if (!this.childIds.includes(object.id)) {
            this.childIds.push(object.id);
            this.refreshBoundingBox();
            this.captureChildSnapshots();
        }
    }

    /**
     * Removes a child object from this group.
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
     * The group itself should be removed after calling this.
     */
    ungroup(): KritzelBaseObject<any>[] {
        return this.children;
    }

    /**
     * Recalculates the group's bounding box based on its children.
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
     * Captures snapshots of child states for transformation operations.
     */
    private captureChildSnapshots(): void {
        this.unchangedChildSnapshots.clear();
        this.snapshotRotation = this.rotation;

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

    override move(startX: number, startY: number, endX: number, endY: number): void {
        const deltaX = (startX - endX) / this._core.store.state.scale;
        const deltaY = (startY - endY) / this._core.store.state.scale;

        this.translateX += deltaX;
        this.translateY += deltaY;

        this._core.store.state.objects.transaction(() => {
            this._core.store.state.objects.update(this);

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

    override resize(x: number, y: number, width: number, height: number): void {
        const widthScaleFactor = width / this.width;
        const heightScaleFactor = height / this.height;

        // Calculate old center
        const oldCenterX = this.translateX + this.totalWidth / 2 / this.scale;
        const oldCenterY = this.translateY + this.totalHeight / 2 / this.scale;

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

        this._core.store.state.objects.transaction(() => {
            this.children.forEach(child => {
                // Calculate child center
                const childCenterX = child.translateX + child.totalWidth / 2 / child.scale;
                const childCenterY = child.translateY + child.totalHeight / 2 / child.scale;

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
                const relativeRotation = child.rotation - rotation;
                const cosRel = Math.cos(relativeRotation);
                const sinRel = Math.sin(relativeRotation);

                const newChildWidthScale = Math.sqrt(
                    Math.pow(widthScaleFactor * cosRel, 2) + Math.pow(heightScaleFactor * sinRel, 2)
                );
                const newChildHeightScale = Math.sqrt(
                    Math.pow(widthScaleFactor * sinRel, 2) + Math.pow(heightScaleFactor * cosRel, 2)
                );

                const updatedWidth = child.width * newChildWidthScale;
                const updatedHeight = child.height * newChildHeightScale;
                const updatedTotalWidth = updatedWidth + child.padding * 2;
                const updatedTotalHeight = updatedHeight + child.padding * 2;

                const updatedX = newChildCenterX - updatedTotalWidth / 2 / child.scale;
                const updatedY = newChildCenterY - updatedTotalHeight / 2 / child.scale;

                child.resize(updatedX, updatedY, updatedWidth, updatedHeight);

                // Update anchored lines
                this._core.anchorManager.updateAnchorsForObject(child.id);
            });

            this.refreshBoundingBox();
            this.captureChildSnapshots();
            this._core.store.state.objects.update(this);
        });
    }

    override rotate(value: number): void {
        this.rotation = value;

        const centerX = this.translateX + this.totalWidth / 2 / this.scale;
        const centerY = this.translateY + this.totalHeight / 2 / this.scale;

        const angle = value - this.snapshotRotation;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        this._core.store.state.objects.transaction(() => {
            this._core.store.state.objects.update(this);

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

    private getOffsetXToCenterFromSnapshot(snapshot: ChildSnapshot): number {
        const childCenterX = snapshot.translateX + snapshot.totalWidth / snapshot.scale / 2;
        const groupCenterX = this.translateX + this.totalWidth / this.scale / 2;
        return childCenterX - groupCenterX;
    }

    private getOffsetYToCenterFromSnapshot(snapshot: ChildSnapshot): number {
        const childCenterY = snapshot.translateY + snapshot.totalHeight / snapshot.scale / 2;
        const groupCenterY = this.translateY + this.totalHeight / this.scale / 2;
        return childCenterY - groupCenterY;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HIT TESTING
    // ─────────────────────────────────────────────────────────────────────────────

    override hitTest(x: number, y: number): boolean {
        // Check if point is inside any child
        return this.children.some(child => child.hitTest(x, y));
    }

    override hitTestPolygon(polygon: KritzelPolygon): boolean {
        // Check if polygon intersects with any child
        return this.children.some(child => child.hitTestPolygon(polygon));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // COPY & SERIALIZATION
    // ─────────────────────────────────────────────────────────────────────────────

    override copy(): KritzelGroup {
        const copiedGroup = KritzelGroup.create(this._core);

        // Deep copy all children and add to the new group
        this.children
            .sort((a, b) => a.zIndex - b.zIndex)
            .forEach(child => {
                const copiedChild = child.copy() as KritzelBaseObject<any>;
                this._core.store.state.objects.insert(copiedChild);
                copiedGroup.childIds.push(copiedChild.id);
            });

        // Copy group properties
        copiedGroup.rotation = this.rotation;
        copiedGroup.refreshBoundingBox();
        copiedGroup.captureChildSnapshots();

        return copiedGroup;
    }

    override serialize() {
        const { _core, _elementRef, element, totalWidth, totalHeight, unchangedChildSnapshots, ...remainingProps } = this as any;

        const clonedProps = structuredClone(remainingProps);

        // Convert Map to plain object for serialization
        clonedProps.unchangedChildSnapshots = Object.fromEntries(this.unchangedChildSnapshots);

        return clonedProps;
    }

    override deserialize<T>(object: any): T {
        super.deserialize(object);

        // Restore the Map from serialized object
        if (object.unchangedChildSnapshots) {
            this.unchangedChildSnapshots = new Map(Object.entries(object.unchangedChildSnapshots));
        }

        return this as unknown as T;
    }

    override update(): void {
        this._core.store.state.objects.update(this);
    }

    /**
     * Updates the workspace ID for this group and all its children.
     */
    updateWorkspaceId(workspaceId: string): void {
        this.workspaceId = workspaceId;
        this.children.forEach(child => {
            child.workspaceId = workspaceId;
            // Recursively update nested groups
            if (child instanceof KritzelGroup) {
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
