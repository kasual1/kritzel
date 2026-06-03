export interface KritzelTool {
  name: string;
  toolType: string;
  handlePointerDown(event: PointerEvent): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
  handleWheel(event: WheelEvent): void;
}
