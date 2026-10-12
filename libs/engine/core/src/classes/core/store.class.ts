import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelPath } from '../objects/path.class';
import { KritzelLine } from '../objects/line.class';
import { KritzelClassHelper } from '../../helpers/class.helper';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelEmbeddedObject } from '../../interfaces/embedded-object.interface';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelBaseObject } from '../objects/base-object.class';

/**
 * Central state management store for the Kritzel engine.
 * Provides reactive state management with change listeners, caching for frequently
 * accessed objects, and computed properties for viewport and selection state.
 */
export class KritzelStore {
  /** Internal state object containing all engine state properties */
  private readonly _state: KritzelEngineState;
  /** Map of property keys to their registered change listeners */
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  // Cached references for O(1) access to frequently accessed special objects
  private _cachedSelectionBox: KritzelSelectionBox | null = null;
  private _cachedSelectionGroup: KritzelSelectionGroup | null = null;
  private _selectionBoxCacheValid: boolean = false;
  private _selectionGroupCacheValid: boolean = false;
  private _localUserId: string | null = null;

  /**
   * Gets the current engine state.
   * @returns The mutable engine state object
   */
  get state(): KritzelEngineState {
    return this._state;
  }


  /**
   *  Gets the map of all objects in the workspace.
   *  Throws an error if the objects map is not initialized, as it is required for all object management.
   *  @returns The KritzelObjectMap containing all objects
   *  @throws Error if the objects map is not initialized in the state
   */
  get objects(): KritzelObjectMap<KritzelBaseObject<Element>> {
    if (!this._state.objects) {
      throw new Error('Objects map is not initialized.');
    }
    return this._state.objects;
  }

 
  /**
   * Gets the host element for the Kritzel editor.
   * Throws an error if the host is not set, as it is required for many operations.
   * @returns The host HTMLElement
   * @throws Error if the host element is not set in the state
   */
  get host(): HTMLElement {
    if (!this._state.host) {
      throw new Error('Host element is not set.');
    }

    return this._state.host;
  }

  /**
   * Gets the next available z-index for new objects.
   * Calculates the maximum z-index among all non-selection objects and adds 1.
   * @returns The next z-index value to use for new objects
   */
  get currentZIndex() {
    return Math.max(0, ...this.objects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox)).map(o => o.zIndex)) + 1;
  }

  /**
   * Returns true if viewport boundaries are set to finite values (not Infinity).
   */
  get hasViewportBoundaries(): boolean {
    return (
      Number.isFinite(this._state.viewportBoundaryLeft) ||
      Number.isFinite(this._state.viewportBoundaryRight) ||
      Number.isFinite(this._state.viewportBoundaryTop) ||
      Number.isFinite(this._state.viewportBoundaryBottom)
    );
  }

  /**
   * Returns the viewport boundary bounds for querying objects.
   * Uses the configured boundaries, defaulting to Infinity for unset values.
   */
  private get viewportBoundaryBounds(): { x: number; y: number; z: number; width: number; height: number } {
    const left = this._state.viewportBoundaryLeft;
    const right = this._state.viewportBoundaryRight;
    const top = this._state.viewportBoundaryTop;
    const bottom = this._state.viewportBoundaryBottom;

    return {
      x: Number.isFinite(left) ? left : -Infinity,
      y: Number.isFinite(top) ? top : -Infinity,
      z: 0,
      width: Number.isFinite(left) && Number.isFinite(right) ? right - left : Infinity,
      height: Number.isFinite(top) && Number.isFinite(bottom) ? bottom - top : Infinity,
    };
  }

  /**
   * Gets the total count of objects in the workspace.
   * When viewport boundaries are set, returns only objects within those boundaries.
   * @returns The total number of objects
   */
  get totalObjectCount(): number {
    if (this.hasViewportBoundaries) {
      return this.allObjects.length;
    }
    return this.objects.totalCount;
  }

  /**
   * Gets all objects in the workspace.
   * When viewport boundaries are set, returns only objects within those boundaries.
   * @returns Array of all canvas objects
   */
  get allObjects(): KritzelBaseObject<Element>[] {
    if (this.hasViewportBoundaries) {
      return this.objects.query(this.viewportBoundaryBounds);
    }
    return this.objects.allObjects();
  }

  /**
   * Gets all objects currently visible in the viewport.
   * Uses spatial querying for efficient retrieval and sorts by z-index.
   * @returns Array of objects within the current viewport, sorted by z-index ascending
   */
  get objectsInViewport(): KritzelBaseObject<Element>[] {
    const viewportBounds = {
      x: -this._state.translateX / this._state.scale,
      y: -this._state.translateY / this._state.scale,
      z: this._state.scale,
      width: this._state.viewportWidth / this._state.scale,
      height: this._state.viewportHeight / this._state.scale,
      depth: 100,
    };

    return this.objects.query(viewportBounds).sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Gets all objects excluding selection-related objects (selection group and selection box).
   * @returns Array of all regular canvas objects
   */
  get allNonSelectionObjects(): KritzelBaseObject<Element>[] {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));
  }

  /**
   * Gets all currently selected objects (excluding the selection group itself).
   * @returns Array of selected objects
   */
  get selectedObjects(): KritzelBaseObject<Element>[] {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox)).filter(o => o.isSelected);
  }

  /**
   * Gets the current selection box if one exists.
   * Uses caching for O(1) access after initial lookup.
   * @returns The selection box or null if none exists
   */
  get selectionBox(): KritzelSelectionBox | null {
    if (this._selectionBoxCacheValid) {
      return this._cachedSelectionBox;
    }
    const selectionBoxes = this.objects.filter(o => o instanceof KritzelSelectionBox);
    this._cachedSelectionBox = selectionBoxes.length > 0 ? (selectionBoxes[0] as KritzelSelectionBox) : null;
    this._selectionBoxCacheValid = true;
    return this._cachedSelectionBox;
  }

  /**
   * Gets the current local user's selection group if one exists.
   * When a local user ID is set, returns only the selection group belonging to that user.
   * Uses caching for O(1) access after initial lookup.
   * @returns The local user's selection group or null if none exists
   */
  get selectionGroup(): KritzelSelectionGroup | null {
    if (this._selectionGroupCacheValid) {
      return this._cachedSelectionGroup;
    }
    const selectionGroups = this.objects.filter(o => o instanceof KritzelSelectionGroup);
    if (this._localUserId) {
      this._cachedSelectionGroup = (selectionGroups as KritzelSelectionGroup[]).find(sg => sg.userId === this._localUserId) ?? null;
    } else {
      this._cachedSelectionGroup = selectionGroups.length > 0 ? (selectionGroups[0] as KritzelSelectionGroup) : null;
    }
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
   * @param box - The selection box to cache, or null to clear the cache
   */
  setSelectionBox(box: KritzelSelectionBox | null): void {
    this._cachedSelectionBox = box;
    this._selectionBoxCacheValid = true;
  }

  /**
   * Directly set the cached selection group reference for O(1) access.
   * Use this when creating the selection group to avoid a filter lookup.
   * @param group - The selection group to cache, or null to clear the cache
   */
  setSelectionGroup(group: KritzelSelectionGroup | null): void {
    this._cachedSelectionGroup = group;
    this._selectionGroupCacheValid = true;
  }

  /**
   * Sets the local user ID for scoping selection group lookups.
   * When set, the selectionGroup getter returns only the group owned by this user.
   * @param userId - The local user's ID, or null for non-collaborative mode
   */
  setLocalUserId(userId: string | null): void {
    this._localUserId = userId;
    this.invalidateSelectionCache();
  }

  /**
   * Gets the currently active text object being edited.
   * @returns The text object in editing mode, or null if none
   */
  get activeText(): KritzelText | null {
    const activeTexts = this.objects.filter(o => o instanceof KritzelText && (o as KritzelText).isEditing);
    return activeTexts.length > 0 ? (activeTexts[0] as KritzelText) : null;
  }

  /**
   * Gets the currently active shape object being edited.
   * @returns The shape object in editing mode, or null if none
   */
  get activeShape(): KritzelShape | null {
    const activeShapes = this.objects.filter(o => o instanceof KritzelShape && (o as KritzelShape).isEditing);
    return activeShapes.length > 0 ? (activeShapes[0] as KritzelShape) : null;
  }

  /**
   * Gets the currently selected dynamic object whose focused descendant is an input-like element.
   * @returns The interactive dynamic object with focused input-like content, or null if none matches
   */
  get activeInteractiveEmbeddedObject(): KritzelEmbeddedObject | null {
    for (const object of this.selectedObjects) {
      if (ObjectHelper.isKritzelEmbeddedObject(object) && object.hasFocusedInputElement()) {
        return object;
      }
    }

    return null;
  }

  get activeInteractiveDynamicObject(): KritzelEmbeddedObject | null {
    return this.activeInteractiveEmbeddedObject;
  }

  /**
   * Gets the path currently being drawn (not yet completed).
   * @returns The incomplete path object, or null if no path is being drawn
   */
  get currentPath(): KritzelPath | null {
    const drawingPaths = this.objects.filter(o => o instanceof KritzelPath && (o as KritzelPath).isCompleted === false);
    return drawingPaths.length > 0 ? (drawingPaths[0] as KritzelPath) : null;
  }

  /**
   * Gets the line currently being drawn (not yet completed).
   * @returns The incomplete line object, or null if no line is being drawn
   */
  get currentLine(): KritzelLine | null {
    const drawingLines = this.objects.filter(o => KritzelClassHelper.isInstanceOf<KritzelLine>(o, 'KritzelLine') && (o as KritzelLine).isCompleted === false);
    return drawingLines.length > 0 ? (drawingLines[0] as KritzelLine) : null;
  }

  /**
   * Gets the horizontal offset of the host element from the viewport.
   * @returns The left position of the host element in client coordinates
   */
  get offsetX() {
    return this.host.getBoundingClientRect().left;
  }

  /**
   * Gets the vertical offset of the host element from the viewport.
   * @returns The top position of the host element in client coordinates
   */
  get offsetY() {
    return this.host.getBoundingClientRect().top;
  }

  /**
   * Checks if the engine is currently disabled.
   * The engine is disabled when not enabled, not ready, or no active workspace exists.
   * @returns True if the engine is disabled and should not process interactions
   */
  get isDisabled() {
    return this._state.isEnabled === false || this._state.isReady === false || this._state.activeWorkspace === null;
  }

  /**
   * Checks if any pointer is currently down (active).
   * @returns True if at least one pointer is currently active
   */
  get isPointerDown() {
    return this._state.pointers.size > 0;
  }

  /**
   * Creates a new KritzelStore instance.
   * @param state - The initial engine state configuration
   */
  constructor(state: KritzelEngineState) {
    this._state = {
      ...state,
      contextMenuItems: [...state.contextMenuItems],
      debugInfo: { ...state.debugInfo },
      pointers: new Map(state.pointers),
      workspaces: [...state.workspaces],
      cursor: { ...state.cursor },
    };
    this._state.objects = new KritzelObjectMap();
  }

  /**
   * Registers a listener for changes to a specific state property.
   * The listener will be called whenever the property value changes.
   * @typeParam K - The state property key type
   * @param property - The property key to listen for changes on
   * @param listener - The callback function to invoke on changes
   */
  onStateChange<K extends StatePropertyKey>(property: K, listener: StateChangeListener<KritzelEngineState[K]>): void {
    if (!this._listeners.has(property)) {
      this._listeners.set(property, new Set());
    }

    const listenersForProperty = this._listeners.get(property);

    if(!listenersForProperty) {
      throw new Error(`Listeners set for property ${String(property)} was not initialized.`);
    }

    listenersForProperty.add(listener);
  }

  /**
   * Gets the current value of a state property as readonly.
   * @typeParam K - The state property key type
   * @param property - The property key to retrieve
   * @returns The current value of the property
   */
  getState<K extends StatePropertyKey>(property: K): Readonly<KritzelEngineState[K]> {
    return this._state[property];
  }

  /**
   * Sets a state property value and notifies registered listeners.
   * Only triggers listeners if the value actually changed.
   * @typeParam K - The state property key type
   * @param property - The property key to set
   * @param value - The new value to assign
   */
  setState<K extends StatePropertyKey>(property: K, value: KritzelEngineState[K]): void {
    const oldValue = this._state[property];

    if (oldValue !== value) {
      this._state[property] = value;

      const listenersForProperty = this._listeners.get(property);

      if (listenersForProperty) {
        listenersForProperty.forEach(listener => listener(value, oldValue, String(property)));
      }
    }
  }
}
