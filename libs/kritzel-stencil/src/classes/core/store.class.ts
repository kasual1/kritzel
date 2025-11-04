import { KritzelSelectionGroup } from '../objects/selection-group.class';
import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelText } from '../objects/text.class';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { KritzelObjectMap } from '../structures/object-map.structure';

export class KritzelStore {
  private readonly _state: KritzelEngineState;
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  get state(): KritzelEngineState {
    return this._state;
  }

  get currentZIndex() {
    return Math.max(0, ...this._state.objectsMap.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox)).map(o => o.zIndex)) + 1;
  }

  get allObjects() {
    return this._state.objectsMap.allObjects();
  }

  get allNonSelectionObjects() {
    return this._state.objectsMap.allObjects().filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox));
  }

  get selectedObjects() {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.isSelected);
  }

  get selectionBox(): KrtizelSelectionBox | null {
    const selectionBoxes = this._state.objectsMap.filter(o => o instanceof KrtizelSelectionBox);
    return selectionBoxes.length > 0 ? (selectionBoxes[0] as KrtizelSelectionBox) : null;
  }

  get selectionGroup(): KritzelSelectionGroup | null {
    const selectionGroups = this._state.objectsMap.filter(o => o instanceof KritzelSelectionGroup);
    return selectionGroups.length > 0 ? (selectionGroups[0] as KritzelSelectionGroup) : null;
  }

  get activeText(): KritzelText | null {
    const activeTexts = this._state.objectsMap.filter(o => o instanceof KritzelText && (o as KritzelText).isEditing);
    return activeTexts.length > 0 ? (activeTexts[0] as KritzelText) : null;
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

  constructor(state: KritzelEngineState) {
    this._state = state;
    this._state.objectsMap = new KritzelObjectMap();
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
