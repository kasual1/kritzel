import { KritzelStore } from '../store.class';
import { KritzelBaseObject } from '../objects/base-object.class';
import { KritzelBaseCommand } from './base.command';

export class UpdateObjectCommand extends KritzelBaseCommand {
  private object: KritzelBaseObject<any>;
  private updatedProperties: Partial<KritzelBaseObject<any>>;
  private previousProperties: Partial<KritzelBaseObject<any>>;

  constructor(
    store: KritzelStore,
    initiator: any,
    object: KritzelBaseObject<any>,
    updatedProperties: Partial<KritzelBaseObject<any>>
  ) {
    super(store, initiator);
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
  }

  undo(): void {
    for (const key in this.previousProperties) {
      if (this.previousProperties.hasOwnProperty(key)) {
        this.object[key] = this.previousProperties[key];
      }
    }
  }
}