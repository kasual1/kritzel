import { KritzelClickHelper } from '../helpers/click.helper';
import { kritzelEngineState, setKritzelEngineState } from '../stores/engine.store';
import { cloneDeep } from 'lodash-es';
import { kritzelViewportState, setKritzelViewportState } from '../stores/viewport.store';
import { KritzelSnapshot } from '../interfaces/snapshot.interface';
import { KritzelReviver } from './reviver.class';

export class KritzelHistory {
  private static instance: KritzelHistory;

  snapshots: string[];

  currentStateIndex: number;

  constructor() {
    if (KritzelHistory.instance) {
      return KritzelHistory.instance;
    }
    this.initialize();
  }

  initialize() {
    this.snapshots = [];
    this.currentStateIndex = -1;
    this.pushSnapshot({
      viewport: cloneDeep(kritzelViewportState),
      engine: cloneDeep(kritzelEngineState),
    });
    KritzelHistory.instance = this;
  }

  createSnapshot() {
    const mostRecentSnapshot = this.getSnapshot();
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

    console.log({
      viewport: cloneDeep(kritzelViewportState),
      engine: cloneDeep(kritzelEngineState),
    })
  }

  handleMouseUp(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.createSnapshot();
    }
  }

  undo() {
    if (this.currentStateIndex > 0) {
      this.currentStateIndex--;
      const snapshot = this.getSnapshot();
      this.recreateStateFromSnapshot(snapshot);
    }
  }

  redo() {
    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.currentStateIndex++;
      const snapshot = this.getSnapshot();
      this.recreateStateFromSnapshot(snapshot);
    }
  }

  private pushSnapshot(snapshot: KritzelSnapshot) {
    const serialzedSnapshot = JSON.stringify(snapshot);

    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentStateIndex + 1);
    }

    this.snapshots.push(serialzedSnapshot);
    this.currentStateIndex++;
  }

  private getSnapshot(): KritzelSnapshot {
    const snapshot = JSON.parse(this.snapshots[this.currentStateIndex]);
    return KritzelReviver.revive(snapshot);
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
