import { KritzelStore } from '../store.class';
import { KritzelBaseTool } from '../tools/base-tool.class';

export class KritzelToolFactory {
private static toolConstructors: Record<string, new (store: KritzelStore) => KritzelBaseTool> = {};

  static createTool(toolName: string, store: KritzelStore): KritzelBaseTool | null {
    const ToolConstructor = this.toolConstructors[toolName];

    if (!ToolConstructor) {
      console.warn(`Unknown tool: ${toolName}`);
      return null;
    }

    return new ToolConstructor(store);
  }

  static registerTool(toolName: string, constructor: new (store: KritzelStore) => KritzelBaseTool): void {
    this.toolConstructors[toolName] = constructor;
  }
}
