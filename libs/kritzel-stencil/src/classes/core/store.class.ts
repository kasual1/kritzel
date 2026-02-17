import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelBaseObject } from '../..';

export class KritzelStore {
  private readonly _state: KritzelEngineState;
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  // Cached references for O(1) access to frequently accessed special objects
  private _cachedSelectionBox: KritzelSelectionBox | null = null;
  private _cachedSelectionGroup: KritzelSelectionGroup | null = null;
  private _selectionBoxCacheValid: boolean = false;
  private _selectionGroupCacheValid: boolean = false;

  get state(): KritzelEngineState {
    return this._state;
  }

  get currentZIndex() {
    return Math.max(0, ...this._state.objects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox)).map(o => o.zIndex)) + 1;
  }

  get totalObjectCount(): number {
    return this._state.objects.totalCount;
  }

  get allObjects(): KritzelBaseObject<Element>[]  {
    return this._state.objects.allObjects();
  }

  get objectsInViewport(): KritzelBaseObject<Element>[]  {
     const viewportBounds = {
      x: -this._state.translateX / this._state.scale,
      y: -this._state.translateY / this._state.scale,
      z: this._state.scale,
      width: this._state.viewportWidth / this._state.scale,
      height: this._state.viewportHeight / this._state.scale,
      depth: 100,
    };

    return this._state.objects
      .query(viewportBounds)
      .filter(obj => !(obj instanceof KritzelSelectionGroup) && !(obj instanceof KritzelSelectionBox))
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  get objectsToRender(): KritzelBaseObject<Element>[] {
    const objects = this.objectsInViewport;
    
    // Add selection objects explicitly since they are filtered out of objectsInViewport
    const selectionGroup = this.selectionGroup;
    if (selectionGroup) {
      objects.push(selectionGroup);
    }
    
    const selectionBox = this.selectionBox;
    if (selectionBox) {
      objects.push(selectionBox);
    }
    
    // Sort combined list by zIndex to ensure correct rendering order
    // This is fast since objectsInViewport is already small compared to allObjects
    return objects.sort((a, b) => a.zIndex - b.zIndex);
  }

  get allNonSelectionObjects(): KritzelBaseObject<Element>[]  {
    return this._state.objects.allObjects().filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));
  }

  get selectedObjects(): KritzelBaseObject<Element>[] {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.isSelected);
  }

  get selectionBox(): KritzelSelectionBox | null {
    if (this._selectionBoxCacheValid) {
      return this._cachedSelectionBox;
    }
    const selectionBoxes = this._state.objects.filter(o => o instanceof KritzelSelectionBox);
    this._cachedSelectionBox = selectionBoxes.length > 0 ? (selectionBoxes[0] as KritzelSelectionBox) : null;
    this._selectionBoxCacheValid = true;
    return this._cachedSelectionBox;
  }

  get selectionGroup(): KritzelSelectionGroup | null {
    if (this._selectionGroupCacheValid) {
      return this._cachedSelectionGroup;
    }
    const selectionGroups = this._state.objects.filter(o => o instanceof KritzelSelectionGroup);
    this._cachedSelectionGroup = selectionGroups.length > 0 ? (selectionGroups[0] as KritzelSelectionGroup) : null;
    this._selectionGroupCacheValid = true;
    return this._cachedSelectionGroup;
  }

  /**
   * Invalidate cached selection objects. Call this when selection objects are inserted or removed.
   */
  invalidateSelectionCache(): void {
    this._selectionBoxCacheValid = false;
    this._selectionGroupCacheValid = false;
  }

  /**
   * Directly set the cached selection box reference for O(1) access.
   * Use this when creating the selection box to avoid a filter lookup.
   */
  setSelectionBox(box: KritzelSelectionBox | null): void {
    this._cachedSelectionBox = box;
    this._selectionBoxCacheValid = true;
  }

  /**
   * Directly set the cached selection group reference for O(1) access.
   * Use this when creating the selection group to avoid a filter lookup.
   */
  setSelectionGroup(group: KritzelSelectionGroup | null): void {
    this._cachedSelectionGroup = group;
    this._selectionGroupCacheValid = true;
  }

  get activeText(): KritzelText | null {
    const activeTexts = this._state.objects.filter(o => o instanceof KritzelText && (o as KritzelText).isEditing);
    return activeTexts.length > 0 ? (activeTexts[0] as KritzelText) : null;
  }

  get activeShape(): KritzelShape | null {
    const activeShapes = this._state.objects.filter(o => o instanceof KritzelShape && (o as KritzelShape).isEditing);
    return activeShapes.length > 0 ? (activeShapes[0] as KritzelShape) : null;
  }

  get currentPath(): KritzelPath | null {
    const drawingPaths = this._state.objects.filter(o => o instanceof KritzelPath && (o as KritzelPath).isCompleted === false);
    return drawingPaths.length > 0 ? (drawingPaths[0] as KritzelPath) : null;
  }

  get currentLine(): KritzelLine | null {
    const drawingLines = this._state.objects.filter(o => o instanceof KritzelLine && (o as KritzelLine).isCompleted === false);
    return drawingLines.length > 0 ? (drawingLines[0] as KritzelLine) : null;
  }

  get offsetX() {
    return this._state.host.getBoundingClientRect().left;
  }

  get offsetY() {
    return this._state.host.getBoundingClientRect().top;
  }

  get isDisabled() {
    return this._state.isEnabled === false || this._state.isReady === false || this._state.activeWorkspace === null;
  }

  get isPointerDown() {
    return this._state.pointers.size > 0;
  }

  constructor(state: KritzelEngineState) {
    this._state = state;
    this._state.objects = new KritzelObjectMap();
  }

  onStateChange<K extends StatePropertyKey>(property: K, listener: StateChangeListener<KritzelEngineState[K]>): void {
    if (!this._listeners.has(property)) {
      this._listeners.set(property, new Set());
    }
    this._listeners.get(property).add(listener);
  }

  getState<K extends StatePropertyKey>(property: K): Readonly<KritzelEngineState[K]> {
    return this._state[property];
  }

  setState<K extends StatePropertyKey>(property: K, value: KritzelEngineState[K]): void {
    const oldValue = this._state[property];

    if (oldValue !== value) {
      this._state[property] = value;

      if (this._listeners.has(property)) {
        this._listeners.get(property).forEach(listener => listener(value, oldValue, String(property)));
      }
    }
  }
}
