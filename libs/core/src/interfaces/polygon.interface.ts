import { UpmadePoint } from "./point.interface";

export interface UpmadePolygon {
  bottomLeft: UpmadePoint;
  bottomRight: UpmadePoint;
  topLeft: UpmadePoint;
  topRight: UpmadePoint;
}