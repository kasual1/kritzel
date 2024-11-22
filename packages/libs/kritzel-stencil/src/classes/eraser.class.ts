import { KritzelTool } from "../components";

export class KritzelEraser implements KritzelTool {
  name: string = 'eraser';
  icon: string = 'eraser';

  handleMouseDown(_event: MouseEvent): void {
  }
  handleMouseMove(_event: MouseEvent): void {
  }
  handleMouseUp(_event: MouseEvent): void {
  }
  handleWheel(_event: WheelEvent): void {
  }

}
