import { KritzelEngineState } from "../stores/engine.store";
import { KritzelViewportState } from "../stores/viewport.store";

export interface KritzelSnapshot {
  viewport: KritzelViewportState,
  engine: KritzelEngineState
}
