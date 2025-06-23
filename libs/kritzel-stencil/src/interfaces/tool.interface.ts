export interface KritzelTool {
  name: string;
  handleMouseDown(event: MouseEvent): void;
  handleMouseMove(event: MouseEvent): void;
  handleMouseUp(event: MouseEvent): void;
  handleDoubleClick(event: MouseEvent): void;
  handleDoubleTap(event: TouchEvent): void;
  handleTouchStart(event: TouchEvent): void;
  handleTouchMove(event: TouchEvent): void;
  handleTouchEnd(event: TouchEvent): void;
  handleWheel(event: WheelEvent): void;
}
