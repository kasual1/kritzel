export interface KritzelSerializable {
  __class__: string;
  serialize(): any;
  deserialize(object: any): KritzelSerializable;
}