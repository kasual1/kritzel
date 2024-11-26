import { KritzelTool } from "../components";

export class KritzelBaseTool implements KritzelTool {
  name: string = 'base';
  icon: string = 'base';

  constructor() {
  }

  handleMouseDown(_event: MouseEvent): void {
  }

  handleMouseMove(_event: MouseEvent): void {
  }

  handleMouseUp(_event: MouseEvent): void {
  }

  handleWheel(_event: WheelEvent): void {
  }
}