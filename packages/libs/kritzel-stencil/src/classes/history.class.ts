import { KritzelClickHelper } from '../helpers/click.helper';
import { kritzelEngineState, setKritzelEngineState } from '../stores/engine.store';
import { cloneDeep } from 'lodash-es';
import { kritzelViewportState, setKritzelViewportState } from '../stores/viewport.store';
import { KritzelSnapshot } from '../interfaces/snapshot.interface';

export class KritzelHistory {
  private static instance: KritzelHistory;

  snapshots: KritzelSnapshot[];

  currentStateIndex: number;

  constructor() {
    if (KritzelHistory.instance) {
      return KritzelHistory.instance;
    }

    this.snapshots = [];
    this.currentStateIndex = -1;
    this.pushSnapshot({
      viewport: cloneDeep(kritzelViewportState),
      engine: cloneDeep(kritzelEngineState),
    });

    KritzelHistory.instance = this;
  }

  handleMouseUp(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.createSnapshot();
    }
  }

  createSnapshot() {
    const mostRecentSnapshot = this.snapshots[this.currentStateIndex];
    const scaleChanged = mostRecentSnapshot.viewport.scale !== kritzelViewportState.scale;
    const translateXChanged = mostRecentSnapshot.viewport.translateX !== kritzelViewportState.translateX;
    const translateYChanged = mostRecentSnapshot.viewport.translateY !== kritzelViewportState.translateY;
    const objectsLengthChanged = mostRecentSnapshot.engine.objects.length !== kritzelEngineState.objects.length;

    if (scaleChanged || translateXChanged || translateYChanged) {
      this.pushSnapshot({
        ...mostRecentSnapshot,
        viewport: {
          ...mostRecentSnapshot.viewport,
          translateX: kritzelViewportState.translateX,
          translateY: kritzelViewportState.translateY,
          scale: kritzelViewportState.scale,
        },
      });
    }

    if (objectsLengthChanged) {
      this.pushSnapshot({
        viewport: cloneDeep(kritzelViewportState),
        engine: cloneDeep(kritzelEngineState),
      });
    }
  }

  undo() {
    if (this.currentStateIndex > 0) {
      this.currentStateIndex--;
      this.recreateStateFromSnapshot(this.snapshots[this.currentStateIndex]);
    }
  }

  redo() {
    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.currentStateIndex++;
      this.recreateStateFromSnapshot(this.snapshots[this.currentStateIndex]);
    }
  }

  private pushSnapshot(snapshot: KritzelSnapshot) {
    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentStateIndex + 1);
    }

    this.snapshots.push(snapshot);
    this.currentStateIndex++;
  }

  private recreateStateFromSnapshot(snapshot: KritzelSnapshot) {
    snapshot = cloneDeep(snapshot);

    for (const key in snapshot.viewport) {
      const value = snapshot.viewport[key];
      setKritzelViewportState(key as any, value);
    }

    for (const key in snapshot.engine) {
      const value = snapshot.engine[key];
      setKritzelEngineState(key as any, value);
    }
  }
}
