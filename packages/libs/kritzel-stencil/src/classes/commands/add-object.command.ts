import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';

export class AddObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  priva

  constructor(store, object) {
    super(store);
    this.object = object;
  }

  execute(): void {
    super.execute();
    this._store.state.objects = [...this._store.state.objects, this.object];
  }

  undo(): void {
    super.undo();
    this._store.state.objects = this._store.state.objects.filter(object => object.id !== this.object.id);
  }
}
