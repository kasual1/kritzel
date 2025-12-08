import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KritzelSelectionBox } from '../objects/selection-box.class';
import { KritzelText } from '../objects/text.class';
import { KritzelShape } from '../objects/shape.class';
import { KritzelPath } from '../objects/path.class';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { KritzelObjectMap } from '../structures/object-map.structure';
import { KritzelBaseObject } from '../..';

export class KritzelStore {
  private readonly _state: KritzelEngineState;
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  get state(): KritzelEngineState {
    return this._state;
  }

  get currentZIndex() {
    return Math.max(0, ...this._state.objects.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox)).map(o => o.zIndex)) + 1;
  }

  get allObjects(): KritzelBaseObject<Element>[]  {
    return this._state.objects.allObjects();
  }

  get allNonSelectionObjects(): KritzelBaseObject<Element>[]  {
    return this._state.objects.allObjects().filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KritzelSelectionBox));
  }

  get selectedObjects(): KritzelBaseObject<Element>[] {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.isSelected);
  }

  get selectionBox(): KritzelSelectionBox | null {
    const selectionBoxes = this._state.objects.filter(o => o instanceof KritzelSelectionBox);
    return selectionBoxes.length > 0 ? (selectionBoxes[0] as KritzelSelectionBox) : null;
  }

  get selectionGroup(): KritzelSelectionGroup | null {
    const selectionGroups = this._state.objects.filter(o => o instanceof KritzelSelectionGroup);
    return selectionGroups.length > 0 ? (selectionGroups[0] as KritzelSelectionGroup) : null;
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
