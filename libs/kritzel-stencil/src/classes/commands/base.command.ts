import { KritzelCommand } from '../../interfaces/command.interface';
import { KritzelCore } from '../core/core.class';

export class KritzelBaseCommand implements KritzelCommand {
  protected _core: KritzelCore;

  initiator: string;
  skipHistory;

  constructor(core: KritzelCore, initiator: any, skipHistory = false) {
    this._core = core;
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
