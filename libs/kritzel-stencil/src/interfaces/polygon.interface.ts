import { KritzelPoint } from "./point.interface";

export interface KritzelPolygon {
  bottomLeft: KritzelPoint;
  bottomRight: KritzelPoint;
  topLeft: KritzelPoint;
  topRight: KritzelPoint;
}