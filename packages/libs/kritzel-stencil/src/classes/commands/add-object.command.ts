import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';

export class AddObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  constructor(store: KritzelStore, initiator: any,  object: KritzelBaseObject<any>) {
    super(store, initiator);
    this.object = object;
  }

  execute(): void {
    this._store.state.objectsOctree.insert(this.object);
  }

  undo(): void {
    this._store.state.objectsOctree.remove(object => object.id === this.object.id);
  }
}
