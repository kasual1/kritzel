import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { KritzelCore } from '../core/core.class';

export class UpdateObjectCommand<T extends KritzelBaseObject<any>> extends KritzelBaseCommand {
  private object: T;
  private updatedProperties: Partial<T>;
  private previousProperties: Partial<T>;

  constructor(core: KritzelCore, initiator: any, object: T, updatedProperties: Partial<T>, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.object = object.copy() as T;
    this.updatedProperties = updatedProperties;

    this.previousProperties = {};
    for (const key in updatedProperties) {
      if (updatedProperties.hasOwnProperty(key)) {
        this.previousProperties[key] = this.object[key];
      }
    }
  }

  execute(): void {
    for (const key in this.updatedProperties) {
      if (this.updatedProperties.hasOwnProperty(key)) {
        this.object[key] = this.updatedProperties[key];
      }
    }

    this.object.onExecuteUpdateCommand(this.updatedProperties);

    this._core.store.state.objectsMap.update(this.object);
    this._core.updateObjectInDatabase(this.object);
  }

  undo(): void {
    for (const key in this.previousProperties) {
      if (this.previousProperties.hasOwnProperty(key)) {
        this.object[key] = this.previousProperties[key];
      }
    }

    this.object.onUndoUpdateCommand(this.previousProperties);

    this._core.store.state.objectsMap.update(this.object);
    this._core.updateObjectInDatabase(this.object);
  }
}
