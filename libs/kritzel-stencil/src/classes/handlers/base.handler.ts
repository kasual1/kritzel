import { KritzelCore } from '../core/core.class';

export class KritzelBaseHandler {
  protected readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
    void this._core; // Avoid unused variable warning
  }
}