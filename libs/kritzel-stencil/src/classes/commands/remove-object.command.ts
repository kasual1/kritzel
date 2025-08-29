import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { KritzelCustomElement } from '../objects/custom-element.class';
import { ObjectHelper } from '../../helpers/object.helper';

export class RemoveObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  constructor(store: KritzelStore, initiator: any,  object: KritzelBaseObject<any>) {
    super(store, initiator);
    this.object = object;
  }

  execute(): void {
    this._store.state.objectsOctree.remove(object => object.id === this.object.id);
    this._store.state.objectsOctree.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._store.database.delete('objects', this.object.id).catch(err => {
      console.error('Error removing object from database:', err);
    });
  }

  undo(): void {
    this._store.state.objectsOctree.insert(this.object);
    this._store.state.objectsOctree.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._store.database.add('objects',  ObjectHelper.clone(this.object)).catch(err => {
      console.error('Error adding object to database:', err);
    });
  }
}
