import { KritzelClickHelper } from '../helpers/click.helper';
import { ObjectHelper } from '../helpers/object.helper';
import { KritzelStore } from '../stores/store';
import { KritzelReviver } from './reviver.class';

export class KritzelHistory {
  reviver: KritzelReviver;

  currentStateIndex: number;

  db: IDBDatabase;

  private readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    this.reviver = new KritzelReviver(this._store);
    this.currentStateIndex = 0;
    this.initializeDatabase().then(() => {
      this.setSnapshot(this._store.state);
    })
  }

  initializeDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('kritzel', 1);

      request.onupgradeneeded = (event: any) => {
        this.db = event.target.result;
        this.db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;

        // Clear the object store on database initialization
        const transaction = this.db.transaction('snapshots', 'readwrite');
        const objectStore = transaction.objectStore('snapshots');
        objectStore.clear();

        resolve(this.db);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  async setSnapshot(snapshot: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('snapshots', 'readwrite');
      console.time('setSnapshot:objectProcessing');
      snapshot = ObjectHelper.removeProperties(snapshot, ['_store', '_elementRef', 'history']);
      snapshot = ObjectHelper.toPlainObject(snapshot);
      console.timeEnd('setSnapshot:objectProcessing');
      snapshot.id = this.currentStateIndex;
      const request = transaction.objectStore('snapshots').add(snapshot);

      this.currentStateIndex++;

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  async getSnapshotById(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('snapshots', 'readonly');
      const request = transaction.objectStore('snapshots').get(id);

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  async countSnapshots(): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('snapshots', 'readonly');
      const request = transaction.objectStore('snapshots').count();

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  handleMouseUp(event: MouseEvent) {
    if (KritzelClickHelper.isLeftClick(event)) {
      this.createSnapshot();
    }
  }

  createSnapshot() {
    this.setSnapshot(this._store.state);
  }

  forceCreateSnapshot() {
    this.setSnapshot(this._store.state);
  }

  undo() {
    if (this.currentStateIndex > 0) {
      this.currentStateIndex--;
      this.getSnapshotById(this.currentStateIndex).then(snapshot => {
        const revivedSnapshot = this.reviver.revive(snapshot);
        this._store.updateEntireState(revivedSnapshot);
      });
    }
  }

  redo() {
    this.countSnapshots().then(count => {
      if (this.currentStateIndex < count) {
        this.currentStateIndex++;
        this.getSnapshotById(this.currentStateIndex).then(snapshot => {
          const revivedSnapshot = this.reviver.revive(snapshot);
          this._store.updateEntireState(revivedSnapshot);
        });
      }
    });
  }

  // initialize() {
  //   this.snapshots = [];
  //   this.currentStateIndex = -1;
  //   this.pushSnapshot({});
  // }

  // createSnapshot() {
  //   const mostRecentSnapshot = this.getSnapshot();
  //   const scaleChanged = mostRecentSnapshot.viewport.scale !== kritzelViewportState.scale;
  //   const translateXChanged = mostRecentSnapshot.viewport.translateX !== kritzelViewportState.translateX;
  //   const translateYChanged = mostRecentSnapshot.viewport.translateY !== kritzelViewportState.translateY;
  //   const objectsLengthChanged = mostRecentSnapshot.engine.objects.length !== this._store.state.objects.length;
  //   if (scaleChanged || translateXChanged || translateYChanged) {
  //     this.pushSnapshot({
  //       ...mostRecentSnapshot,
  //       viewport: {
  //         ...mostRecentSnapshot.viewport,
  //         translateX: kritzelViewportState.translateX,
  //         translateY: kritzelViewportState.translateY,
  //         scale: kritzelViewportState.scale,
  //       },
  //     });
  //   }
  //   if (objectsLengthChanged) {
  //     this.pushSnapshot({
  //     });
  //   }
  // }

  // forceCreateSnapshot() {
  //   this.pushSnapshot({
  //   });
  // }

  // handleMouseUp(event: MouseEvent) {
  //   if (KritzelClickHelper.isLeftClick(event)) {
  //     this.createSnapshot();
  //   }
  // }

  // undo() {
  //   if (this.currentStateIndex > 0) {
  //     this.currentStateIndex--;
  //     const snapshot = this.getSnapshot();
  //     this.recreateStateFromSnapshot(snapshot);
  //   }
  // }

  // redo() {
  //   if (this.currentStateIndex < this.snapshots.length - 1) {
  //     this.currentStateIndex++;
  //     const snapshot = this.getSnapshot();
  //     this.recreateStateFromSnapshot(snapshot);
  //   }
  // }

  // private pushSnapshot(snapshot: any) {
  //   const serialzedSnapshot = ObjectHelper.toPlainObject(snapshot);

  //   if (this.currentStateIndex < this.snapshots.length - 1) {
  //     this.snapshots = this.snapshots.slice(0, this.currentStateIndex + 1);
  //   }

  //   this.snapshots.push(serialzedSnapshot);
  //   this.currentStateIndex++;
  // }

  // private getSnapshot(): any {
  //   const snapshot = this.snapshots[this.currentStateIndex];
  //   return new KritzelReviver(this._store).revive(snapshot);
  // }

  // private recreateStateFromSnapshot(snapshot: any) {
  //   for (const key in snapshot.viewport) {
  //     const value = snapshot.viewport[key];
  //     setKritzelViewportState(key as any, value);
  //   }
  //   for (const key in snapshot.engine) {
  //     const value = snapshot.engine[key];
  //     setKritzelEngineState(key as any, value);
  //   }
  // }
}
