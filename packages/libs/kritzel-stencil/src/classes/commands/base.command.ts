import { KritzelCommand } from '../../interfaces/command.interface';
import { KritzelStore } from '../../stores/store';

export class KritzelBaseCommand implements KritzelCommand {
  scale: number;
  translateX: number;
  translateY: number;

  protected _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    this.scale = store.state.scale;
    this.translateX = store.state.translateX;
    this.translateY = store.state.translateY;
  }

  execute(): void {
    this._store.state.scale = this.scale;
    this._store.state.translateX = this.translateX;
    this._store.state.translateY = this.translateY;
  }

  undo(): void {
    this._store.state.scale = this.scale;
    this._store.state.translateX = this.translateX;
    this._store.state.translateY = this.translateY;
  }
}
