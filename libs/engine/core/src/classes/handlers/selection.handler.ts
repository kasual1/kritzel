import { KritzelEventHelper } from '../../helpers/event.helper';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelGroup } from '../objects/group.class';
import { KritzelBaseHandler } from './base.handler';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelCore } from '../core/core.class';

/**
 * Handles object selection interactions on the canvas.
 * Supports both click-to-select and drag-to-select (marquee) selection modes
 * for mouse, touch, and pen input types. Also handles additive selection
 * via shift/ctrl modifiers.
 */
export class KritzelSelectionHandler extends KritzelBaseHandler {
  startX: number = 0;
  startY: number = 0;

  touchStartX: number = 0;
  touchStartY: number = 0;

  touchStartTimeout: any = null;

  /**
   * Tracks previously selected objects for efficient deselection.
   * Uses a Set for O(1) lookup when determining which objects need to be deselected.
   */
  private _previouslySelectedObjects: Set<KritzelBaseObject<any>> = new Set();

  /**
   * Indicates whether the current selection action is a single click (no drag).
   * @returns `true` if a selection box exists with zero width and height
   */
  get isSelectionClick() {
    const selectionBox = this._core.store.selectionBox;
    return selectionBox && selectionBox.width === 0 && selectionBox.height === 0;
  }

  /**
   * Indicates whether the current selection action is a drag selection (marquee).
   * @returns `true` if a selection box exists with non-zero width or height
   */
  get isSelectionDrag() {
    const selectionBox = this._core.store.selectionBox;
    return selectionBox && (selectionBox.width > 0 || selectionBox.height > 0);
  }

  /**
   * Creates a new selection handler instance.
   * @param core - The KritzelCore instance providing access to store, engine, and other core services
   */
  constructor(core: KritzelCore) {
    super(core);
  }

  /**
   * Handles the pointer down event to initiate selection.
   * For mouse input, starts selection on left-click when no selection group exists or in additive mode.
   * For touch/pen input, initiates selection after a brief delay (80ms) to distinguish from other gestures.
   * @param event - The pointer event containing input type, coordinates, and modifier keys
   */
  handlePointerDown(event: PointerEvent) {
    if (this._core.store.state.isResizeHandleSelected || this._core.store.state.isRotationHandleSelected) {
      return;
    }

    const isAdditive = event.shiftKey || event.ctrlKey;
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event) && (!this._core.store.selectionGroup || isAdditive)) {
        this.startMouseSelection(event, isAdditive);
      }
    }

    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      this.touchStartTimeout = setTimeout(() => {
        if (this._core.store.state.pointers.size === 1 && !this._core.store.state.isScaling && (!this._core.store.selectionGroup || isAdditive)) {
          this.startTouchSelection(event, isAdditive);
          this.updateTouchSelection();
        }
      }, 80);
    }
  }

  /**
   * Handles the pointer move event to update the selection box during drag selection.
   * For mouse input, updates selection when actively selecting.
   * For touch/pen input, updates selection and cancels long-touch timeout if movement exceeds threshold.
   * @param event - The pointer event containing current pointer position and input type
   */
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

        const timeout = this._core.store.state.longTouchTimeout;

        if (timeout) {
          globalThis.clearTimeout?.(timeout);
        }
      }
    }
  }

  /**
   * Handles the pointer up event to complete the selection action.
   * Determines whether the action was a click or drag selection and processes accordingly.
   * Triggers object edit mode when a single object is selected without movement.
   * Emits objects change event after selection completes.
   * @param event - The pointer event containing input type, coordinates, and modifier keys
   */
  handlePointerUp(event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      if (KritzelEventHelper.isLeftClick(event)) {
        const hasObjectsMoved = this._core.store.state.hasObjectsChanged;
        const selectionGroup = this._core.store.selectionGroup;
        const isAdditive = event.shiftKey || event.ctrlKey;

        if (selectionGroup?.objects.length === 1 && hasObjectsMoved === false && !isAdditive) {
          selectionGroup.objects[0].edit(event);
        }

        this._core.store.state.hasObjectsChanged = false;

        if (this._core.store.state.isSelecting) {
          if (this.isSelectionClick) {
            this.handleSelectionClick(event);
          }

          if (this.isSelectionDrag) {
            const isAdditive = event.shiftKey || event.ctrlKey;
            this.updateMouseSelection(event);
            this.addSelectedObjectsToSelectionGroup(isAdditive);
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
      const isAdditive = event.shiftKey || event.ctrlKey;

      if (selectionGroup?.objects.length === 1 && hasObjectsMoved === false && !isAdditive) {
        selectionGroup.objects[0].edit(event);
      }

      this._core.store.state.hasObjectsChanged = false;

      if (this._core.store.state.isSelecting) {
        if (this.isSelectionClick) {
          this.handleSelectionClick(event);
        }

        if (this.isSelectionDrag) {
          const isAdditive = event.shiftKey || event.ctrlKey;
          this.updateTouchSelection();
          this.addSelectedObjectsToSelectionGroup(isAdditive);
          this.removeSelectionBox();
        }

        this._core.engine.emitObjectsChange();
        this._core.store.state.skipContextMenu = false;
      }
    }
  }

  /**
   * Removes the selection box from the canvas and resets selection state.
   * Clears the selecting flag and removes the selection box object from the store.
   */
  private removeSelectionBox(): void {
    this._core.store.state.isSelecting = false;
    this._core.store.objects.remove(o => o instanceof KritzelSelectionBox);
    this._core.store.setSelectionBox(null);
    this._core.store.objects.clearLocalSelectionBox();
  }

  /**
   * Initiates a mouse-based selection by creating a selection box at the click position.
   * Calculates canvas coordinates accounting for offset, translation, and scale.
   * In non-additive mode, clears any existing selection group.
   * @param event - The mouse event containing click coordinates
   * @param isAdditive - When `true`, preserves existing selection group for adding objects
   */
  private startMouseSelection(event: MouseEvent, isAdditive: boolean = false): void {
    let clientX, clientY;

    clientX = event.clientX - this._core.store.offsetX;
    clientY = event.clientY - this._core.store.offsetY;

    const selectionBox = KritzelSelectionBox.create(this._core);

    this.startX = (clientX - this._core.store.state.translateX) / this._core.store.state.scale;
    this.startY = (clientY - this._core.store.state.translateY) / this._core.store.state.scale;

    selectionBox.translateX = this.startX;
    selectionBox.translateY = this.startY;

    this._core.store.state.isSelecting = true;

    this._core.removeSelectionBox();
    if (!isAdditive) {
      this._core.removeSelectionGroup();
    }
    this._core.store.objects.insert(selectionBox);
    this._core.store.setSelectionBox(selectionBox);
  }

  /**
   * Initiates a touch/pen-based selection by creating a selection box at the touch position.
   * Uses the first active pointer from the pointers map to determine coordinates.
   * In non-additive mode, clears any existing selection group.
   * @param _event - The pointer event (unused, coordinates from active pointers)
   * @param isAdditive - When `true`, preserves existing selection group for adding objects
   */
  private startTouchSelection(_event: PointerEvent, isAdditive: boolean = false): void {
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

    this._core.removeSelectionBox();
    if (!isAdditive) {
      this._core.removeSelectionGroup();
    }
    this._core.store.objects.insert(selectionBox);
    this._core.store.setSelectionBox(selectionBox);
  }

  /**
   * Updates the selection box dimensions during mouse drag.
   * Calculates the new width, height, and position based on current mouse position
   * relative to the start position. Supports selection in any direction.
   * @param event - The mouse event containing current cursor position
   */
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

      this._core.store.objects.setLocalSelectionBox({
        x: selectionBox.translateX,
        y: selectionBox.translateY,
        width: width / selectionBox.scale,
        height: height / selectionBox.scale,
      });

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  /**
   * Updates the selection box dimensions during touch/pen drag.
   * Uses the first active pointer to calculate new dimensions.
   * Supports selection in any direction by using absolute width/height
   * and positioning at the minimum coordinates.
   */
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

      this._core.store.objects.setLocalSelectionBox({
        x: selectionBox.translateX,
        y: selectionBox.translateY,
        width: width / selectionBox.scale,
        height: height / selectionBox.scale,
      });

      if (width > 0 || height > 0) {
        this.updateSelectedObjects();
      } else {
        this.clearSelectionPreview();
      }
    }
  }

  /**
   * Updates the selection state of objects intersecting with the selection box.
   * Uses quadtree spatial indexing for efficient O(log n + k) candidate lookup.
   * Performs polygon-based hit testing for accurate rotated selection support.
   * Efficiently deselects only previously selected objects that no longer intersect.
   */
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
      height: maxY - minY,
    };

    const candidates = this._core.store.objects.query(selectionBounds);

    // Track newly selected objects for efficient comparison
    const newlySelectedObjects = new Set<KritzelBaseObject<any>>();

    // Only test candidates that overlap the bounding box
    for (const object of candidates) {
      if (object instanceof KritzelSelectionBox || object instanceof KritzelSelectionGroup) continue;
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

  /**
   * Handles a single-click selection action.
   * Finds the topmost object at the click position and adds it to the selection group.
   * Supports additive selection mode via shift/ctrl modifier keys.
   * @param event - The pointer event containing click coordinates and modifier keys
   */
  private handleSelectionClick(event: PointerEvent): void {
    const selectedObject = this.getTopmostHitObject(event);
    const isAdditive = event.shiftKey || event.ctrlKey;

    this.clearSelectionPreview();

    if(selectedObject){
      this.addObjectToSelectionGroup(selectedObject, isAdditive);
    }

    this.removeSelectionBox();
  }

  /**
   * Finds the topmost (highest z-order) object at the pointer position.
   * Iterates through overlapping objects from top to bottom and performs hit testing.
   * Excludes selection-related objects (selection box and selection group).
   * @param event - The pointer event used to query overlapping DOM elements
   * @returns The topmost object that passes hit testing, or `null` if none found
   */
  private getTopmostHitObject(event: PointerEvent): KritzelBaseObject<any> | null {
    const pointerX = this._core.store.state.pointerX;
    const pointerY = this._core.store.state.pointerY;
    const overlappingObjects = this._core.getObjectsFromPointerEvent(event, '.object');

    for (const object of overlappingObjects) {
      if (object instanceof KritzelSelectionBox || object instanceof KritzelSelectionGroup) continue;
      if (object.hitTest(pointerX, pointerY)) {
        return object;
      }
    }

    return null;
  }

  /**
   * Clears the visual selection preview by deselecting all previously selected objects.
   * Operates in O(k) time where k is the number of previously selected objects,
   * rather than O(n) by iterating only tracked objects.
   */
  private clearSelectionPreview(): void {
    // Only clear previously tracked selected objects - O(k) instead of O(n)
    const selectedGroupIds = new Set(this._core.store.selectionGroup?.objectIds ?? []);
    for (const obj of this._previouslySelectedObjects) {
      if (!selectedGroupIds.has(obj.id)) {
        obj.isSelected = false;
      }
    }
    this._previouslySelectedObjects.clear();
  }

  /**
   * Adds a single object to the selection group.
   * Resolves child objects to their parent groups before adding.
   * In additive mode (shift), toggles object presence in existing group.
   * In non-additive mode, creates a new selection group with the object.
   * @param object - The object to add to selection (may be a child of a group)
   * @param shiftKey - When `true`, adds to/removes from existing selection group
   */
  private addObjectToSelectionGroup(object: KritzelBaseObject, shiftKey: boolean = false): void {
    if (!object) {
      return;
    }

    // Resolve child objects to their parent groups
    const parentGroup = KritzelGroup.findParentGroup(this._core, object.id);
    const objectToSelect = parentGroup || object;

    // When the click resolves to a parent group, clear the child's own flag so
    // it does not linger as selected and re-select the group on the next interaction.
    if (parentGroup) {
      object.isSelected = false;
    }

    const existingGroup = this._core.store.selectionGroup;
    if (shiftKey && existingGroup) {
      existingGroup.addOrRemove(objectToSelect);
      this.removeDescendantsOfSelectedGroups(existingGroup);
      if (existingGroup.objects.length === 0) {
        this._core.removeSelectionGroup();
      } else {
        this._core.rerender();
      }
    } else {
      const selectionGroup = KritzelSelectionGroup.create(this._core);
      selectionGroup.addOrRemove(objectToSelect);
      selectionGroup.isSelected = true;

      this._core.addSelectionGroup(selectionGroup);
      this._core.rerender();
    }
  }

  /**
   * Adds all currently selected objects to a selection group.
   * Builds a parent group lookup map for efficient O(n) resolution of child objects.
   * Deduplicates objects by ID to prevent duplicate entries from group resolution.
   * In additive mode, adds to existing group; otherwise creates a new selection group.
   * Captures unchanged snapshots and refreshes dimensions once at the end for O(n) performance.
   * @param shiftKey - When `true`, adds objects to existing selection group
   */
  private addSelectedObjectsToSelectionGroup(shiftKey: boolean = false): void {
    const selectedObjects = this._core.store.selectedObjects;

    if (selectedObjects.length === 0) {
      return;
    }

    // Build parent group lookup map ONCE - O(g * c) instead of O(n * g * c)
    const allGroups = this._core.store.objects.filter(obj => obj.__class__ === 'KritzelGroup') as KritzelGroup[];
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
      if (parentGroup) {
        // The child was selected (e.g. via marquee preview) but selection is
        // represented by its parent group. Clear the child's flag so it does
        // not linger as selected and re-select the group on the next interaction.
        obj.isSelected = false;
        resolvedObjects.set(parentGroup.id, parentGroup);
      } else {
        resolvedObjects.set(obj.id, obj);
      }
    }

    const unrolledObjects = Array.from(resolvedObjects.values());
    const filteredObjects = this.filterDescendantsOfSelectedGroups(unrolledObjects);
    const existingGroup = this._core.store.selectionGroup;

    if (shiftKey && existingGroup) {
      existingGroup.addObjects(filteredObjects);
      this.removeDescendantsOfSelectedGroups(existingGroup);
      this._previouslySelectedObjects.clear();
      this._core.rerender();
    } else {
      // Create selection group and set all IDs at once (no per-item refresh)
      const selectionGroup = KritzelSelectionGroup.create(this._core);
      selectionGroup.objectIds = filteredObjects.map(o => o.id);
      filteredObjects.forEach(obj => {
        obj.isSelected = true;
      });

      // Only refresh dimensions and capture snapshots ONCE at the end - O(n) instead of O(n²)
      if (selectionGroup.length === 1) {
        selectionGroup.rotation = selectionGroup.objects[0].rotation;
      }
      selectionGroup.captureUnchangedSnapshots();
      selectionGroup.refreshObjectDimensions();
      selectionGroup.isSelected = true;

      this._core.addSelectionGroup(selectionGroup);
      this._previouslySelectedObjects.clear();
      this._core.rerender();
    }
  }

  /**
   * Removes objects that are descendants of any KritzelGroup also present in the list.
   * Prevents an ancestor group and one of its descendants from coexisting in a selection,
   * which would otherwise cause the descendant to be transformed twice (once via the
   * ancestor group, and once directly).
   * @param objects - The candidate objects for the selection.
   * @returns A new array with descendants of selected groups removed.
   */
  private filterDescendantsOfSelectedGroups(objects: KritzelBaseObject<any>[]): KritzelBaseObject<any>[] {
    const descendantIds = new Set<string>();
    for (const obj of objects) {
      if (obj instanceof KritzelGroup) {
        KritzelGroup.collectDescendantIds(obj, descendantIds);
      }
    }
    if (descendantIds.size === 0) {
      return objects;
    }
    return objects.filter(o => !descendantIds.has(o.id));
  }

  /**
   * Mutates an existing selection group to remove any descendants of groups
   * already present in it. See {@link filterDescendantsOfSelectedGroups}.
   * @param selectionGroup - The selection group to clean up in place.
   */
  private removeDescendantsOfSelectedGroups(selectionGroup: KritzelSelectionGroup): void {
    const filtered = this.filterDescendantsOfSelectedGroups(selectionGroup.objects);
    if (filtered.length !== selectionGroup.objects.length) {
      selectionGroup.objectIds = filtered.map(o => o.id);
    }
  }
}
