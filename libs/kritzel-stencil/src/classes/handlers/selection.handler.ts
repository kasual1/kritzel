import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelCore } from '../core/core.class';

export class KritzelSelectionHandler extends KritzelBaseHandler {
  startX: number;
  startY: number;

  touchStartX: number = 0;
  touchStartY: number = 0;

  touchStartTimeout: any = null;

  // Track previously selected objects for efficient deselection (WeakRef to avoid memory leaks)
  private _previouslySelectedObjects: Set<KritzelBaseObject<any>> = new Set();

  get isSelectionClick() {
    const selectionBox = this._core.store.selectionBox;
    return selectionBox && selectionBox.width === 0 && selectionBox.height === 0;
  }

  get isSelectionDrag() {
    const selectionBox = this._core.store.selectionBox;
    return selectionBox && (selectionBox.width > 0 || selectionBox.height > 0);
  }

  constructor(core: KritzelCore) {
    super(core);
  }

  handlePointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && !this._core.store.selectionGroup) {
        this.startMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.store.state.pointers.size === 1 && !this._core.store.state.isScaling && !this._core.store.selectionGroup) {
          this.startTouchSelection();
          this.updateTouchSelection();
        }
      }, 80);
    }
  }

  handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (this._core.store.state.isSelecting) {
        this.updateMouseSelection(event);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      const activePointers = Array.from(this._core.store.state.pointers.values());

      const x = Math.round(activePointers[0].clientX - this._core.store.offsetX);
      const y = Math.round(activePointers[0].clientY - this._core.store.offsetY);

      const moveDeltaX = Math.abs(x - this.touchStartX);
      const moveDeltaY = Math.abs(y - this.touchStartY);
      const moveThreshold = 5;

      if ((moveDeltaX > moveThreshold || moveDeltaY > moveThreshold) && this._core.store.state.isSelecting) {
        this.updateTouchSelection();

        clearTimeout(this._core.store.state.longTouchTimeout);
      }
    }
  }

  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const hasObjectsMoved = this._core.store.state.hasObjectsChanged;
        const selectionGroup = this._core.store.selectionGroup;

        if (selectionGroup?.objects.length === 1 && hasObjectsMoved === false) {
          selectionGroup.objects[0].edit(event);
        }

        this._core.store.state.hasObjectsChanged = false;

        if (this._core.store.state.isSelecting) {
          if (this.isSelectionClick) {
            this.handleSelectionClick(event);
          }

          if (this.isSelectionDrag) {
            this.updateMouseSelection(event);
            this.addSelectedObjectsToSelectionGroup();
            this.removeSelectionBox();
          }

          this._core.engine.emitObjectsChange();
        }
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      clearTimeout(this.touchStartTimeout);

      const hasObjectsMoved = this._core.store.state.hasObjectsChanged;
      const selectionGroup = this._core.store.selectionGroup;

      if (selectionGroup?.objects.length === 1 && hasObjectsMoved === false) {
        selectionGroup.objects[0].edit(event);
      }

      this._core.store.state.hasObjectsChanged = false;

      if (this._core.store.state.isSelecting) {
        if (this.isSelectionClick) {
          this.handleSelectionClick(event);
        }

        if (this.isSelectionDrag) {
          this.updateTouchSelection();
          this.addSelectedObjectsToSelectionGroup();
          this.removeSelectionBox();
        }

        this._core.engine.emitObjectsChange();
        this._core.store.state.skipContextMenu = false;
      }
    }
  }

  private removeSelectionBox(): void {
    this._core.store.state.isSelecting = false;
    this._core.store.state.objects.remove(o => o instanceof KritzelSelectionBox);
    this._core.store.setSelectionBox(null);
  }

  private startMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = KritzelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
    this.startY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.store.state.isSelecting = true;

    this._core.store.state.objects.remove(o => o instanceof KritzelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.store.setSelectionBox(null);
    this._core.store.setSelectionGroup(null);
    this._core.store.state.objects.insert(selectionBox);
    this._core.store.setSelectionBox(selectionBox);
  }

  private startTouchSelection(): void {
    const activePointers = Array.from(this._core.store.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);
    this.touchStartX = clientX;
    this.touchStartY = clientY;

    const selectionBox = KritzelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
    this.startY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.store.state.isSelecting = true;

    this._core.store.state.objects.remove(o => o instanceof KritzelSelectionBox || o instanceof KritzelSelectionGroup);
    this._core.store.setSelectionBox(null);
    this._core.store.setSelectionGroup(null);
    this._core.store.state.objects.insert(selectionBox);
    this._core.store.setSelectionBox(selectionBox);
  }

  private updateMouseSelection(event: MouseEvent): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = this._core.store.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.store.state.translateY) / selectionBox.scale;

      const width = Math.abs(currentX - this.startX) * selectionBox.scale;
      const height = Math.abs(currentY - this.startY) * selectionBox.scale;

      selectionBox.width = width;
      selectionBox.height = height;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  private updateTouchSelection(): void {
    const activePointers = Array.from(this._core.store.state.pointers.values());
    const firstTouch = activePointers[0];

    if (!firstTouch) {
      return;
    }

    let clientX, clientY;

    clientX = Math.round(firstTouch.clientX - this._core.store.offsetX);
    clientY = Math.round(firstTouch.clientY - this._core.store.offsetY);

    const selectionBox = this._core.store.selectionBox;

    if (selectionBox) {
      const currentX = (clientX - this._core.store.state.translateX) / selectionBox.scale;
      const currentY = (clientY - this._core.store.state.translateY) / selectionBox.scale;

      const width = Math.abs(currentX - this.startX) * selectionBox.scale;
      const height = Math.abs(currentY - this.startY) * selectionBox.scale;

      selectionBox.width = width;
      selectionBox.height = height;
      selectionBox.translateX = Math.min(currentX, this.startX);
      selectionBox.translateY = Math.min(currentY, this.startY);

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  private updateSelectedObjects(): void {
    const selectionBox = this._core.store.selectionBox;
    if (!selectionBox) return;

    // Compute rotatedPolygon once per update (not per object)
    const selectionPolygon = selectionBox.rotatedPolygon;

    // Calculate bounding box from the polygon we already have to avoid recomputing it
    // calling selectionBox.rotatedBoundingBox would trigger another rotatedPolygon computation
    const xValues = [selectionPolygon.topLeft.x, selectionPolygon.topRight.x, selectionPolygon.bottomRight.x, selectionPolygon.bottomLeft.x];
    const yValues = [selectionPolygon.topLeft.y, selectionPolygon.topRight.y, selectionPolygon.bottomRight.y, selectionPolygon.bottomLeft.y];
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Use quadtree spatial query to get only nearby candidates - O(log n + k) instead of O(n)
    const selectionBounds = {
      x: minX,
      y: minY,
      z: selectionBox.scale,
      width: maxX - minX,
      height: maxY - minY
    };
    
    const candidates = this._core.store.state.objects.query(selectionBounds);

    // Track newly selected objects for efficient comparison
    const newlySelectedObjects = new Set<KritzelBaseObject<any>>();

    // Only test candidates that overlap the bounding box
    for (const object of candidates) {
      if (object instanceof KritzelSelectionBox) continue;
      const isHit = object.hitTestPolygon(selectionPolygon);
      object.isSelected = isHit;
      if (isHit) {
        newlySelectedObjects.add(object);
      }
    }

    // Deselect only objects that were previously selected but aren't anymore
    // This is O(k) where k is the number of previously selected objects, not O(n)
    for (const prevObj of this._previouslySelectedObjects) {
      if (!newlySelectedObjects.has(prevObj)) {
        prevObj.isSelected = false;
      }
    }

    this._previouslySelectedObjects = newlySelectedObjects;
  }

  private handleSelectionClick(event: PointerEvent): void {
    const selectedObject = this.getTopmostHitObject(event);

    this.clearSelectionPreview();

    this.addObjectToSelectionGroup(selectedObject);
    this.removeSelectionBox();
  }

  private getTopmostHitObject(event: PointerEvent): KritzelBaseObject<any> | null {
    const pointerX = this._core.store.state.pointerX;
    const pointerY = this._core.store.state.pointerY;
    const overlappingObjects = this._core.getObjectsFromPointerEvent(event, '.object');

    for (const object of overlappingObjects) {
      if (object instanceof KritzelSelectionBox) continue;
      if (object.hitTest(pointerX, pointerY)) {
        return object;
      }
    }

    return null;
  }

  private clearSelectionPreview(): void {
    // Only clear previously tracked selected objects - O(k) instead of O(n)
    for (const obj of this._previouslySelectedObjects) {
      obj.isSelected = false;
    }
    this._previouslySelectedObjects.clear();
  }

  private addObjectToSelectionGroup(object: KritzelBaseObject): void {
    if (!object) {
      return;
    }

    // Resolve child objects to their parent groups
    const parentGroup = KritzelGroup.findParentGroup(this._core, object.id);
    const objectToSelect = parentGroup || object;

    objectToSelect.isSelected = false;

    const selectionGroup = KritzelSelectionGroup.create(this._core);
    selectionGroup.addOrRemove(objectToSelect);
    selectionGroup.isSelected = true;
    selectionGroup.rotation = objectToSelect.rotation;

    this._core.addSelectionGroup(selectionGroup);
    this._core.rerender();
  }

  private addSelectedObjectsToSelectionGroup(): void {
    const selectedObjects = this._core.store.selectedObjects;

    if (selectedObjects.length === 0) {
      return;
    }

    // Build parent group lookup map ONCE - O(g * c) instead of O(n * g * c)
    const allGroups = this._core.store.state.objects.filter(
      obj => obj.__class__ === 'KritzelGroup',
    ) as KritzelGroup[];
    const childToParentMap = new Map<string, KritzelGroup>();
    for (const group of allGroups) {
      for (const childId of group.childIds) {
        childToParentMap.set(childId, group);
      }
    }

    // Resolve child objects to their parent groups in a single pass - O(n)
    const resolvedObjects = new Map<string, KritzelBaseObject<any>>();
    for (const obj of selectedObjects) {
      const parentGroup = childToParentMap.get(obj.id);
      const toSelect = parentGroup || obj;
      resolvedObjects.set(toSelect.id, toSelect);
      obj.isSelected = false;
    }

    // Create selection group and set all IDs at once (no per-item refresh)
    const selectionGroup = KritzelSelectionGroup.create(this._core);
    selectionGroup.objectIds = Array.from(resolvedObjects.keys());

    // Only refresh dimensions and capture snapshots ONCE at the end - O(n) instead of O(n²)
    selectionGroup.captureUnchangedSnapshots();
    selectionGroup.refreshObjectDimensions();
    selectionGroup.isSelected = true;

    if (selectionGroup.length === 1) {
      selectionGroup.rotation = selectionGroup.objects[0].rotation;
    }

    this._core.addSelectionGroup(selectionGroup);
    this._core.rerender();
  }
}
