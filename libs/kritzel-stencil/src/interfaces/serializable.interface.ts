export interface KritzelSerializable {
  __class__: string;
  revive(object: any): KritzelSerializable;
}