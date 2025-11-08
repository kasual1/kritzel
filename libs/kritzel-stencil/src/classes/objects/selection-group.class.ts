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

  minX: number;
  maxX: number;

  minY: number;
  maxY: number;

  // Getter to retrieve actual objects from the store by their IDs
  get objects(): KritzelBaseObject<any>[] {
    return this.objectIds
      .map(id => {
        const found = this._core.store.state.objectsMap.filter(obj => obj.id === id);
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

    this._core.store.state.objectsMap.update(this);
  }

  /**
   * Capture snapshots of current object states for undo/redo operations
   */
  private captureUnchangedSnapshots(): void {
    this.unchangedObjectSnapshots.clear();
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
    this._core.store.state.objectsMap.update(this);
  }

  override move(startX: number, startY: number, endX: number, endY: number): void {
    const deltaX = (startX - endX) / this._core.store.state.scale;
    const deltaY = (startY - endY) / this._core.store.state.scale;

    this.translateX += deltaX;
    this.translateY += deltaY;

    this._core.store.state.objectsMap.transaction(() => {
      this._core.store.state.objectsMap.update(this);

      this.objects.forEach(obj => {
        obj.move(startX, startY, endX, endY);
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

    const deltaX = x - this.translateX;
    const deltaY = y - this.translateY;

    this._core.store.state.objectsMap.transaction(() => {
      this.objects.forEach(child => {
        const updatedWidth = child.width * widthScaleFactor;
        const updatedHeight = child.height * heightScaleFactor;

        const updatedX = child.translateX + deltaX + (child.translateX - this.translateX) * (widthScaleFactor - 1);
        const updatedY = child.translateY + deltaY + (child.translateY - this.translateY) * (heightScaleFactor - 1);

        child.resize(updatedX, updatedY, updatedWidth, updatedHeight);
      });
    });

    this.refreshObjectDimensions();
    this.captureUnchangedSnapshots();
  }

  override rotate(value: number): void {
    this.rotation = value;

    const centerX = this.translateX + this.totalWidth / 2 / this.scale;
    const centerY = this.translateY + this.totalHeight / 2 / this.scale;

    const angle = value;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    this._core.store.state.objectsMap.transaction(() => {
      this.objects.forEach(child => {
        const unchangedSnapshot = this.unchangedObjectSnapshots.get(child.id);
        if (!unchangedSnapshot) return;

        const offsetX = this.getOffsetXToCenterFromSnapshot(unchangedSnapshot);
        const offsetY = this.getOffsetYToCenterFromSnapshot(unchangedSnapshot);

        const rotatedX = cos * offsetX - sin * offsetY;
        const rotatedY = sin * offsetX + cos * offsetY;

        child.translateX = centerX + rotatedX - child.totalWidth / 2 / child.scale;
        child.translateY = centerY + rotatedY - child.totalHeight / 2 / child.scale;

        child.rotate(this.objects.length === 1 ? value : value + unchangedSnapshot.rotation);
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
      this.minX = Math.min(...this.objects.map(obj => obj.minXRotated));
      this.maxX = Math.max(...this.objects.map(obj => obj.maxXRotated));

      this.minY = Math.min(...this.objects.map(obj => obj.minYRotated));
      this.maxY = Math.max(...this.objects.map(obj => obj.maxYRotated));

      this.translateX = this.minX - this.padding;
      this.translateY = this.minY - this.padding;

      this.width = (this.maxX - this.minX - this.padding) * this.scale;
      this.height = (this.maxY - this.minY - this.padding) * this.scale;
    }

    this._core.store.state.objectsMap.update(this);
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
