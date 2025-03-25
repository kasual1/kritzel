import { KritzelCommand } from '../../interfaces/command.interface';
import { KritzelStore } from '../../stores/store';

export class KritzelBaseCommand implements KritzelCommand {
  protected _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
  }

  execute(): void {
    throw new Error('Method not implemented.');
  }

  undo(): void {
    throw new Error('Method not implemented.');
  }
}
