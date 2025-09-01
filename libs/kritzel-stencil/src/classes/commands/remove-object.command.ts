import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { KritzelCustomElement } from '../objects/custom-element.class';
import { ObjectHelper } from '../../helpers/object.helper';

export class RemoveObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;

  constructor(store: KritzelStore, initiator: any,  object: KritzelBaseObject<any>, skipHistory = false) {
    super(store, initiator, skipHistory);
    this.object = object;
  }

  execute(): void {
    this._store.state.objectsOctree.remove(object => object.id === this.object.id);
    this._store.state.objectsOctree.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._store.deleteObjectFromDatabase(this.object.id);
  }

  undo(): void {
    this._store.state.objectsOctree.insert(this.object);
    this._store.state.objectsOctree.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._store.addObjectToDatabase(ObjectHelper.clone(this.object));
  }
}
