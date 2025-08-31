import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { ObjectHelper } from '../../helpers/object.helper';

export class AddObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  constructor(store: KritzelStore, initiator: any,  object: KritzelBaseObject<any>, skipHistory = false) {
    super(store, initiator, skipHistory);
    this.object = object;
  }

  execute(): void {
    this._store.state.objectsOctree.insert(this.object);
    this._store.database.add('objects',  ObjectHelper.clone(this.object)).catch(err => {
      console.error('Error adding object to database:', err);
    });
  }

  undo(): void {
    this._store.state.objectsOctree.remove(object => object.id === this.object.id);
    this._store.database.delete('objects', this.object.id).catch(err => {
      console.error('Error removing object from database:', err);
    });
  }
}
