import { KritzelCommand } from '../../interfaces/command.interface';
import { KritzelStore } from '../store.class';

export class KritzelBaseCommand implements KritzelCommand {
  protected _store: KritzelStore;

  initiator: string;
  skipHistory;

  constructor(store: KritzelStore, initiator: any, skipHistory = false) {
    this._store = store;
    this.initiator = initiator?.constructor?.name ?? 'Unknown';
    this.skipHistory = skipHistory;
  }

  execute(): void {
    throw new Error('Method not implemented.');
  }

  undo(): void {
    throw new Error('Method not implemented.');
  }
}
