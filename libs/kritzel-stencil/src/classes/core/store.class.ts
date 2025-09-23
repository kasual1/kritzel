import { KritzelEngineState } from '../../interfaces/engine-state.interface';
import { StateChangeListener, StatePropertyKey } from '../../types/state.types';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KrtizelSelectionBox } from '../objects/selection-box.class';
import { KritzelSelectionGroup } from '../objects/selection-group.class';

export class KritzelStoreNew {
  private readonly _state: KritzelEngineState;
  private readonly _listeners: Map<StatePropertyKey, Set<StateChangeListener<any>>> = new Map();

  get state(): KritzelEngineState {
    return this._state;
  }

  get currentZIndex() {
    return this._state.objectsMap.filter(o => !(o instanceof KritzelSelectionGroup) && !(o instanceof KrtizelSelectionBox)).length;
  }

  get allObjects() {
    return this._state.objectsMap.allObjects();
  }

  get selectedObjects() {
    return this.allObjects.filter(o => !(o instanceof KritzelSelectionGroup)).filter(o => o.isSelected);
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

  findObjectById(id: string): KritzelBaseObject<any> | null {
    for (const object of this.allObjects) {
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  onStateChange<K extends StatePropertyKey>(property: K, listener: StateChangeListener<KritzelEngineState[K]>): void {
    if (!this._listeners.has(property)) {
      this._listeners.set(property, new Set());
    }
    this._listeners.get(property).add(listener);
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
