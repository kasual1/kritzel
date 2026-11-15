export interface UpmadeSerializable {
  __class__: string;
  serialize(): any;
  deserialize(object: any): UpmadeSerializable;
}