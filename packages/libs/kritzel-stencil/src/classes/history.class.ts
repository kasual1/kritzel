import { KritzelClickHelper } from '../helpers/click.helper';
import { kritzelEngineState, setKritzelEngineState } from '../stores/engine.store';
import { cloneDeep } from 'lodash-es';
import { kritzelViewportState, setKritzelViewportState } from '../stores/viewport.store';
import { KritzelSnapshot } from '../interfaces/snapshot.interface';

export class KritzelHistory {
  snapshots: KritzelSnapshot[];

  currentStateIndex: number;

  constructor() {
    this.snapshots = [];
    this.currentStateIndex = -1;
    this.pushSnapshot({
      viewport: cloneDeep(kritzelViewportState),
      engine: cloneDeep(kritzelEngineState),
    });
  }

  handleMouseUp(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.pushSnapshot({
        viewport: cloneDeep(kritzelViewportState),
        engine: cloneDeep(kritzelEngineState),
      });
    }
  }

  undo() {
    if (this.currentStateIndex > 0) {
      this.currentStateIndex--;

      for (const key in this.snapshots[this.currentStateIndex].viewport) {
        const value = this.snapshots[this.currentStateIndex].viewport[key];
        setKritzelViewportState(key as any, value);
      }

      for (const key in this.snapshots[this.currentStateIndex].engine) {
        const value = this.snapshots[this.currentStateIndex].engine[key];
        setKritzelEngineState(key as any, value);
      }
    }
  }

  redo() {
    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.currentStateIndex++;

      for (const key in this.snapshots[this.currentStateIndex].viewport) {
        const value = this.snapshots[this.currentStateIndex].viewport[key];
        setKritzelViewportState(key as any, value);
      }

      for (const key in this.snapshots[this.currentStateIndex].engine) {
        const value = this.snapshots[this.currentStateIndex].engine[key];
        setKritzelEngineState(key as any, value);
      }
    }
  }

  private pushSnapshot(snapshot: KritzelSnapshot) {
    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentStateIndex + 1);
    }

    this.snapshots.push(snapshot);
    this.currentStateIndex++;
  }
}
