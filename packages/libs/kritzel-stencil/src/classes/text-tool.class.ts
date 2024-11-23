import { KritzelTool } from "../components";

export class KritzelTextTool implements KritzelTool {
  name: string = 'text';
  icon: string = 'text';

  handleMouseDown(_event: MouseEvent): void {
	// Do nothing
  }

  handleMouseMove(_event: MouseEvent): void {
	// Do nothing
  }

  handleMouseUp(_event: MouseEvent): void {
	// Do nothing
  }

  handleWheel(_event: WheelEvent): void {
	// Do nothing
  }
}