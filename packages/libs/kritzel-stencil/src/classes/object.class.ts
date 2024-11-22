import { KritzelBoundingBox } from "../interfaces/bounding-box.interface";
import { KritzelObject } from "../interfaces/object.interface";

export class KritzelObjectBase implements KritzelObject{
  id: string;
  visible: boolean;
  isInViewport(_viewport: KritzelBoundingBox, _scale: number): boolean {
    throw new Error("Method not implemented.");
  }
}
