import { createStore } from "@stencil/store";
import { KritzelPath } from "../classes/objects/path.class";
import { KritzelTool } from "../interfaces/tool.interface";
import { KritzelBaseObject } from "../classes/objects/base-object.class";
export interface KritzelEngineState {
  activeTool: KritzelTool;
  currentPath?: KritzelPath;
  objects: KritzelBaseObject<Element>[];
  showDebugInfo: boolean;
}

const { state: kritzelEngineState, set: setKritzelEngineState } = createStore<KritzelEngineState>({
  activeTool: undefined,
  currentPath: undefined,
  objects: [],
  showDebugInfo: true,
});

export function findObjectById(id: string): KritzelBaseObject<any> | null  {
  for (const object of kritzelEngineState.objects) {
    if (object.id === id) {
      return object;
    }
  }
  return null;
}

export function deselectAllObjects(): void {
  for (const object of kritzelEngineState.objects) {
    object.selected = false;
  }

  kritzelEngineState.objects = [...kritzelEngineState.objects];
}

export function getCurrentZIndex(): number {
  return kritzelEngineState.objects.length;
}

export { kritzelEngineState, setKritzelEngineState };
