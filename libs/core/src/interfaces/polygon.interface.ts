import { UpdrawPoint } from "./point.interface";

export interface UpdrawPolygon {
  bottomLeft: UpdrawPoint;
  bottomRight: UpdrawPoint;
  topLeft: UpdrawPoint;
  topRight: UpdrawPoint;
}