export interface UpdrawSerializable {
  __class__: string;
  serialize(): any;
  deserialize(object: any): UpdrawSerializable;
}