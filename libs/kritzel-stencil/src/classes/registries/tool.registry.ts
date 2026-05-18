import { KritzelCore } from "../core/core.class";
import { KritzelBaseTool } from "../tools/base-tool.class";

/**
 * A static registry for managing drawing tools in the Kritzel library.
 * Tools are instantiated and stored by name, allowing retrieval by name or index.
 */
export class KritzelToolRegistry {
  /** Internal storage for registered tools, mapping tool names to their instances. */
  private static registry: Record<string, KritzelBaseTool> = {};

  /**
   * Registers a new tool by instantiating it with the provided constructor and core instance.
   * The tool is stored in the registry under the specified name.
   *
   * @param toolName - The unique identifier for the tool.
   * @param constructor - The tool class constructor that extends `KritzelBaseTool`.
   * @param core - The `KritzelCore` instance to pass to the tool constructor.
   * @returns The newly created and registered tool instance.
   */
  static registerTool(toolName: string, constructor: new (core: KritzelCore) => KritzelBaseTool, core: KritzelCore): KritzelBaseTool {
    const toolInstance = new constructor(core);
    toolInstance.name = toolName;
    this.registry[toolName] = toolInstance;
    return toolInstance;
  }

  /**
   * Checks if a tool with the given name is registered.
   *
   * @param toolName - The unique identifier of the tool to check.
   * @returns `true` if the tool is registered, `false` otherwise.
   */
  static hasTool(toolName: string): boolean {
    return toolName in this.registry;
  }

  /**
   * Retrieves a registered tool by its name.
   * Logs a warning if the tool is not found.
   *
   * @param toolName - The unique identifier of the tool to retrieve.
   * @returns The tool instance if found, or `null` if not registered.
   */
  static getTool(toolName: string): KritzelBaseTool | null {
    const toolInstance = this.registry[toolName];

    if (!toolInstance) {
      console.warn(`Unknown tool: ${toolName}`);
      return null;
    }

    return toolInstance;
  }

  /**
   * Retrieves a registered tool by its index in the registry.
   * The index is based on the order tools were registered.
   *
   * @param index - The zero-based index of the tool in the registry.
   * @returns The tool instance at the specified index, or `null` if the index is out of bounds.
   */
  static getToolByIndex(index: number): KritzelBaseTool | null {
    return Object.values(this.registry)[index] ?? null;
  }
}
