import { ClickHelper } from '../helpers/click.helper';
import { KritzelEngineState, set } from '../stores/kritzel-engine.store';
import { cloneDeep } from 'lodash-es';

export class History {
  states: KritzelEngineState[];

  currentState: number;

  constructor(state: KritzelEngineState) {
    this.states = [];
    this.currentState = -1;
    this.pushState(state);
  }

  handleMouseUp(event: MouseEvent, state: KritzelEngineState) {
    if (ClickHelper.isLeftClick(event)) {
      this.pushState(state);
    }
  }

  undo() {
    if (this.currentState > 0) {
      this.currentState--;
      this.setStateFromSnapshot(this.states[this.currentState]);
    }
  }

  redo() {
    if (this.currentState < this.states.length - 1) {
      this.currentState++;
      this.setStateFromSnapshot(this.states[this.currentState]);
    }
  }

  private pushState(state: KritzelEngineState) {
    const snapshot = this.getSnapshotFromState(state);
    this.states = this.states.slice(0, this.currentState + 1);
    this.states.push(snapshot);
    this.currentState++;
    console.log(this.states);
  }

  private getSnapshotFromState(state: any): KritzelEngineState {
    const snapshot = {};
    for (const key in state) {
      snapshot[key] = state[key];
    }

    return cloneDeep(snapshot);
  }

  private setStateFromSnapshot(snapshot: KritzelEngineState): void {
    Object.keys(snapshot).forEach(key => {
      set(key as any, snapshot[key]);
    });
  }
}
