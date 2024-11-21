export interface Tool {
  name: string;
  icon: string;
  handleMouseDown(event: MouseEvent): void;
  handleMouseMove(event: MouseEvent): void;
  handleMouseUp(event: MouseEvent): void;
  handleWheel(event: WheelEvent): void;
}
