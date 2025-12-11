import { KritzelCore } from '../core/core.class';
import { KritzelBaseObject } from './base-object.class';

interface UnchangedObjectSnapshot {
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

export class KritzelSelectionGroup extends KritzelBaseObject<HTMLElement> {
  override __class__: string = 'KritzelSelectionGroup';

  // Store only object IDs instead of full objects
  objectIds: string[] = [];
  
  // Store snapshots of object state for transformations (rotation, resize)
  unchangedObjectSnapshots: Map<string, UnchangedObjectSnapshot> = new Map();
  snapshotRotation: number = 0;

  minX: number;
  maxX: number;

  minY: number;
  maxY: number;

  // Getter to retrieve actual objects from the store by their IDs
  get objects(): KritzelBaseObject<any>[] {
    return this.objectIds
      .map(id => {
        const found = this._core.store.state.objects.filter(obj => obj.id === id);
        return found.length > 0 ? found[0] : null;
      })
      .filter(obj => obj !== null) as KritzelBaseObject<any>[];
  }

  get length(): number {
    return this.objectIds.length;
  }

  static override create(core: KritzelCore): KritzelSelectionGroup {
    const object = new KritzelSelectionGroup();

    object._core = core;
    object.id = object.generateId();
    object.workspaceId = core.store.state.activeWorkspace.id;
    object.scale = core.store.state.scale;
    object.zIndex = 99999;

    return object;
  }

  addOrRemove(object: KritzelBaseObject<any>) {
    const index = this.objectIds.findIndex(id => id === object.id);
    if (index === -1) {
      this.objectIds.push(object.id);
    } else {
      this.objectIds.splice(index, 1);
    }

    this.captureUnchangedSnapshots();
    this.refreshObjectDimensions();
  }

  deselectAllChildren() {
    this.objects.forEach(obj => (obj.isSelected = false));
  }

  updateWorkspaceId(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.objects.forEach(obj => (obj.workspaceId = workspaceId));
  }

  updateZIndices(startZIndex: number) {
    this.objects.forEach((obj, i) => {
      obj.zIndex = startZIndex + i;
    });
  }

  updatePosition(x: number, y: number) {
    this.objects.forEach(obj => {
      const deltaX = obj.translateX - this.translateX;
      const deltaY = obj.translateY - this.translateY;
      obj.updatePosition(x + deltaX, y + deltaY);
    });

    // Update snapshots
    this.unchangedObjectSnapshots.forEach(snapshot => {
      const deltaX = snapshot.translateX - this.translateX;
      const deltaY = snapshot.translateY - this.translateY;
      snapshot.translateX = x + deltaX;
      snapshot.translateY = x + deltaY;
    });

    this.translateX = x;
    this.translateY = y;

    this._core.store.state.objects.update(this);
  }

  /**
   * Capture snapshots of current object states for undo/redo operations
   */
  private captureUnchangedSnapshots(): void {
    this.unchangedObjectSnapshots.clear();
    this.snapshotRotation = this.rotation;
    this.objects.forEach(obj => {
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

  override serialize() {
    const { _core, _elementRef, element, totalWidth, totalHeight, unchangedObjectSnapshots, ...remainingProps } = this as any;

    const clonedProps = structuredClone(remainingProps);

    if (element && typeof element === 'object' && 'nodeType' in element && element.nodeType === 1) {
      clonedProps.element = element.cloneNode(true) as HTMLElement;
    }

    // Convert Map to plain object for serialization
    clonedProps.unchangedObjectSnapshots = Object.fromEntries(this.unchangedObjectSnapshots);

    return clonedProps;
  }

  override deserialize<T>(object: any): T {
    // First, deserialize all base properties using parent's deserialize
    super.deserialize(object);

    // Restore the Map from serialized object
    if (object.unchangedObjectSnapshots) {
      this.unchangedObjectSnapshots = new Map(Object.entries(object.unchangedObjectSnapshots));
    }

    return this as unknown as T;
  }

  override update(): void {
    // Only update the selection group itself
    // Child objects are already updated during move/resize/rotate operations
    // Updating them again here would create redundant y.js updates
    this._core.store.state.objects.update(this);
  }

  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this._core.store.state.objects.transaction(() => {
      this._core.store.state.objects.update(this);

      this.objects.forEach(obj => {
        obj.move(startX, startY, endX, endY);

        // Update any lines that are anchored to this object
        this._core.anchorManager.updateAnchorsForObject(obj.id);
      });
    });

    // Update snapshots
    this.unchangedObjectSnapshots.forEach(snapshot => {
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
      this.objects.forEach(child => {
        // Calculate child center
        const childCenterX = child.translateX + child.totalWidth / 2 / child.scale;
        const childCenterY = child.translateY + child.totalHeight / 2 / child.scale;

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
        // Calculate relative rotation
        const relativeRotation = child.rotation - rotation;
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

        const updatedWidth = child.width * newChildWidthScale;
        const updatedHeight = child.height * newChildHeightScale;
        const updatedTotalWidth = updatedWidth + child.padding * 2;
        const updatedTotalHeight = updatedHeight + child.padding * 2;

        const updatedX = newChildCenterX - updatedTotalWidth / 2 / child.scale;
        const updatedY = newChildCenterY - updatedTotalHeight / 2 / child.scale;

        child.resize(updatedX, updatedY, updatedWidth, updatedHeight);
      });

      // Refresh dimensions and update the SelectionGroup to propagate changes to other tabs
      this.refreshObjectDimensions();
      this.captureUnchangedSnapshots();
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
      // Update the SelectionGroup itself to propagate rotation to other tabs
      this._core.store.state.objects.update(this);

      this.objects.forEach(child => {
        const unchangedSnapshot = this.unchangedObjectSnapshots.get(child.id);
        if (!unchangedSnapshot) return;

        const offsetX = this.getOffsetXToCenterFromSnapshot(unchangedSnapshot);
        const offsetY = this.getOffsetYToCenterFromSnapshot(unchangedSnapshot);

        const rotatedX = cos * offsetX - sin * offsetY;
        const rotatedY = sin * offsetX + cos * offsetY;

        child.translateX = centerX + rotatedX - child.totalWidth / 2 / child.scale;
        child.translateY = centerY + rotatedY - child.totalHeight / 2 / child.scale;

        child.rotate(this.objects.length === 1 ? value : unchangedSnapshot.rotation + angle);
      });
    });
  }

  override copy(): KritzelBaseObject<HTMLElement> {
    const selectionGroup = KritzelSelectionGroup.create(this._core);

    this.objects
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(obj => {
        const copiedObject = obj.copy() as KritzelBaseObject<any>;
        selectionGroup.addOrRemove(copiedObject);
      });

    selectionGroup.captureUnchangedSnapshots();

    if (this.objects.length === 1) {
      selectionGroup.rotation = this.objects[0].rotation;
    }

    return selectionGroup;
  }

  refreshObjectDimensions() {
    if (this.objects.length === 1) {
      const obj = this.objects[0];
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

      this.objects.forEach(obj => {
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

    this._core.store.state.objects.update(this);
  }

  private getOffsetXToCenterFromSnapshot(snapshot: UnchangedObjectSnapshot): number {
    const objCenterX = snapshot.translateX + snapshot.totalWidth / snapshot.scale / 2;
    const groupCenterX = this.translateX + this.totalWidth / this.scale / 2;
    return objCenterX - groupCenterX;
  }

  private getOffsetYToCenterFromSnapshot(snapshot: UnchangedObjectSnapshot): number {
    const objCenterY = snapshot.translateY + snapshot.totalHeight / snapshot.scale / 2;
    const groupCenterY = this.translateY + this.totalHeight / this.scale / 2;
    return objCenterY - groupCenterY;
  }
}
