import { KritzelStore } from '../../stores/store';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';

export class AddObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  constructor(store: KritzelStore, object: KritzelBaseObject<any>) {
    super(store);
    this.object = object;
  }

  execute(): void {
    this._store.state.objects = [...this._store.state.objects, this.object];
  }

  undo(): void {
    this._store.state.objects = this._store.state.objects.filter(object => object.id !== this.object.id);
  }
}
