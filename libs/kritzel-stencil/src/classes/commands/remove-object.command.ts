import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { KritzelCustomElement } from '../objects/custom-element.class';
import { KritzelCore } from '../core/core.class';

export class RemoveObjectCommand<T extends KritzelBaseObject<any>> extends KritzelBaseCommand {
  private object: T;

  constructor(core: KritzelCore, initiator: any,  object: T, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.object = object;
  }

  execute(): void {
    this._core.store.state.objectsMap.remove(object => object.id === this.object.id);
    this._core.store.state.objectsMap.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._core.deleteObjectFromDatabase(this.object.id);
  }

  undo(): void {
    this._core.store.state.objectsMap.insert(this.object);
    this._core.store.state.objectsMap.filter(object => object instanceof KritzelCustomElement).forEach(object => object.remount());
    this._core.addObjectToDatabase(this.object);
  }
}
