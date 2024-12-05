import { createStore } from "@stencil/store";
import { KritzelPath } from "../classes/objects/path.class";
import { KritzelTool } from "../interfaces/tool.interface";
import { KritzelBaseObject } from "../classes/objects/base-object.class";
import { KritzelObject } from "../interfaces/object.interface";
export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  objects: KritzelBaseObject<Element>[];
  showDebugPanel: boolean;
}

const { state: kritzelEngineState, set: setKritzelEngineState } = createStore<KritzelEngineState>({
  activeTool: undefined,
  currentPath: undefined,
  objects: [],
  showDebugPanel: false,
});


export function findObjectById(id: string): KritzelObject | null  {
  for (const object of kritzelEngineState.objects) {
    if (object.id === id) {
      return object;
    }
  }
}

export function deselectAllObjects(): void {
  for (const object of kritzelEngineState.objects) {
    object.selected = false;
  }

  kritzelEngineState.objects = [...kritzelEngineState.objects];
}

export { kritzelEngineState, setKritzelEngineState };
