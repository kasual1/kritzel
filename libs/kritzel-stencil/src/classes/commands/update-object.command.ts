import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';
import { ObjectHelper } from '../../helpers/object.helper';
import { KritzelCore } from '../core/core.class';

export class UpdateObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;
  private updatedProperties: Partial<KritzelBaseObject<any>>;
  private previousProperties: Partial<KritzelBaseObject<any>>;

  constructor(core: KritzelCore, initiator: any, object: KritzelBaseObject<any>, updatedProperties: Partial<KritzelBaseObject<any>>, skipHistory = false) {
    super(core, initiator, skipHistory);
    this.object = object;
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

    this._core.updateObjectInDatabase(ObjectHelper.clone(this.object));
  }

  undo(): void {
    for (const key in this.previousProperties) {
      if (this.previousProperties.hasOwnProperty(key)) {
        this.object[key] = this.previousProperties[key];
      }
    }

    this._core.updateObjectInDatabase(ObjectHelper.clone(this.object));
  }
}
