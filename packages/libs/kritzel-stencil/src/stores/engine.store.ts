import { createStore } from "@stencil/store";
import { KritzelPath } from "../classes/path.class";
import { KritzelTool } from "../interfaces/tool.interface";
export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  paths: KritzelPath[];
  showDebugPanel: boolean;
}

const { state: kritzelEngineState, set: setKritzelEngineState } = createStore<KritzelEngineState>({
  activeTool: undefined,
  currentPath: undefined,
  paths: [],
  showDebugPanel: true,
});


export { kritzelEngineState, setKritzelEngineState };
