import { KritzelCommand } from '../../interfaces/command.interface';
import { KritzelStore } from '../store.class';

export class KritzelBaseCommand implements KritzelCommand {
  protected _store: KritzelStore;

  initiator: string;
  isUndoable;

  constructor(store: KritzelStore, initiator: any) {
    this._store = store;
    this.initiator = initiator?.constructor?.name ?? 'Unknown';
    this.isUndoable = true;
  }

  execute(): void {
    throw new Error('Method not implemented.');
  }

  undo(): void {
    throw new Error('Method not implemented.');
  }
}
