import { KritzelBaseTool } from "../components";
import { KritzelStore } from "./store.class";

export class KritzelToolRegistry {
private static registry: Record<string, KritzelBaseTool> = {};

  static registerTool(toolName: string, constructor: new (store: KritzelStore) => KritzelBaseTool, store: KritzelStore): KritzelBaseTool {
    const toolInstance = new constructor(store);
    this.registry[toolName] = toolInstance;
    return toolInstance;
  }

  static getTool(toolName: string): KritzelBaseTool | null {
    const toolInstance = this.registry[toolName];

    if (!toolInstance) {
      console.warn(`Unknown tool: ${toolName}`);
      return null;
    }

    return toolInstance;
  }
}
