import { KritzelEngineState } from "../stores/kritzel-engine.store";

export interface Tool {
  name: string;
  icon: string;
  handleMouseDown(event: MouseEvent, state: KritzelEngineState): void;
  handleMouseMove(event: MouseEvent, state: KritzelEngineState): void;
  handleMouseUp(event: MouseEvent, state: KritzelEngineState): void;
  handleWheel(event: WheelEvent, state: KritzelEngineState): void;
}
