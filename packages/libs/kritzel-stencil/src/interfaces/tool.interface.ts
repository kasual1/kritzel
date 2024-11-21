import { KritzelEngineState } from "../stores/kritzel-engine.store";

export interface Tool {
  name: string;
  icon: string;
  state: KritzelEngineState;
  handleMouseDown(event: MouseEvent): void;
  handleMouseMove(event: MouseEvent): void;
  handleMouseUp(event: MouseEvent): void;
  handleWheel(event: WheelEvent): void;
}
