import { KritzelClickHelper } from '../helpers/click.helper';
import { kritzelViewportState, setKritzelViewportState } from '../stores/viewport.store';
import { KritzelReviver } from './reviver.class';
import { ObjectHelper } from '../helpers/object.helper';
import { KritzelStore } from '../stores/store';

export class KritzelHistory {

  snapshots: any[];

  currentStateIndex: number;

  private readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    // this.initialize();
  }

  initialize() {
    this.snapshots = [];
    this.currentStateIndex = -1;
    this.pushSnapshot({});
  }

  createSnapshot() {
    // const mostRecentSnapshot = this.getSnapshot();
    // const scaleChanged = mostRecentSnapshot.viewport.scale !== kritzelViewportState.scale;
    // const translateXChanged = mostRecentSnapshot.viewport.translateX !== kritzelViewportState.translateX;
    // const translateYChanged = mostRecentSnapshot.viewport.translateY !== kritzelViewportState.translateY;
    // const objectsLengthChanged = mostRecentSnapshot.engine.objects.length !== this._store.state.objects.length;

    // if (scaleChanged || translateXChanged || translateYChanged) {
    //   this.pushSnapshot({
    //     ...mostRecentSnapshot,
    //     viewport: {
    //       ...mostRecentSnapshot.viewport,
    //       translateX: kritzelViewportState.translateX,
    //       translateY: kritzelViewportState.translateY,
    //       scale: kritzelViewportState.scale,
    //     },
    //   });
    // }

    // if (objectsLengthChanged) {
    //   this.pushSnapshot({
    //   });
    // }
  }

  forceCreateSnapshot() {
    // this.pushSnapshot({
    // });
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

  private pushSnapshot(snapshot: any) {
    const serialzedSnapshot = ObjectHelper.toPlainObject(snapshot);

    if (this.currentStateIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentStateIndex + 1);
    }

    this.snapshots.push(serialzedSnapshot);
    this.currentStateIndex++;
  }

  private getSnapshot(): any {
    const snapshot = this.snapshots[this.currentStateIndex];
    return new KritzelReviver(this._store).revive(snapshot);
  }

  private recreateStateFromSnapshot(snapshot: any) {

    for (const key in snapshot.viewport) {
      const value = snapshot.viewport[key];
      setKritzelViewportState(key as any, value);
    }

    // for (const key in snapshot.engine) {
    //   const value = snapshot.engine[key];
    //   setKritzelEngineState(key as any, value);
    // }
  }
}
