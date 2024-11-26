import { createStore } from "@stencil/store";
import { KritzelPath } from "../classes/path.class";
import { KritzelTool } from "../interfaces/tool.interface";
import { KritzelBaseObject } from "../classes/base-object.class";
export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  objects: KritzelBaseObject[];
  showDebugPanel: boolean;
}

const { state: kritzelEngineState, set: setKritzelEngineState } = createStore<KritzelEngineState>({
  activeTool: undefined,
  currentPath: undefined,
  objects: [],
  showDebugPanel: true,
});


export { kritzelEngineState, setKritzelEngineState };
