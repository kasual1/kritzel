import { KritzelCore } from "../core/core.class";
import { KritzelBaseTool } from "../tools/base-tool.class";

export class KritzelToolRegistry {
private static registry: Record<string, KritzelBaseTool> = {};

  static registerTool(toolName: string, constructor: new (core: KritzelCore) => KritzelBaseTool, core: KritzelCore): KritzelBaseTool {
    const toolInstance = new constructor(core);
    toolInstance.name = toolName;
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

  static getToolByIndex(index: number): KritzelBaseTool | null {
    return Object.values(this.registry)[index] ?? null;
  }
}
