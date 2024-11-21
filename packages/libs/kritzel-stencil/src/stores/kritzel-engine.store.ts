import { createStore } from "@stencil/store";
import { Path } from "../classes/path.class";
import { Tool } from "../components";

export interface KritzelEngineState {
  activeTool: Tool;
  currentPath?: Path;
  cursorX: number;
  cursorY: number;
  paths: Path[];
  scale: number;
  scaleMax: number;
  scaleMin: number;
  scaleStep: number;
  showDebugPanel: boolean;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
}

const { state, set } = createStore<KritzelEngineState>({
  activeTool: undefined,
  cursorX: 0,
  cursorY: 0,
  paths: [],
  scale: 1,
  scaleMax: 1000,
  scaleMin: 0.0001,
  scaleStep: 0.05,
  showDebugPanel: false,
  startX: 0,
  startY: 0,
  translateX: 0,
  translateY: 0,
});

export default state;
export { set };
