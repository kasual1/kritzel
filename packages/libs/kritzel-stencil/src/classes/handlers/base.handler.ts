import { KritzelStore } from '../store.class';

export class KritzelBaseHandler {
  protected readonly _store: KritzelStore;

  constructor(store: KritzelStore) {
    this._store = store;
    void this._store; // Avoid unused variable warning
  }
}