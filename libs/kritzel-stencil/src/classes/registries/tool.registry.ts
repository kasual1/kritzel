import { KritzelCore } from "../core/core.class";
import { KritzelBaseTool } from "../tools/base-tool.class";

/**
 * A per-engine registry for managing drawing tools in the Kritzel library.
 * Each `KritzelCore` owns its own `KritzelToolRegistry` instance so that
 * multiple editors on the same page do not share tool instances or configs.
 *
 * Tools are instantiated and stored by name, allowing retrieval by name or index.
 */
export class KritzelToolRegistry {
  /** Internal storage for registered tools, mapping tool names to their instances. */
  private registry: Record<string, KritzelBaseTool> = {};

  /**
   * Creates a new tool registry bound to a specific `KritzelCore` instance.
   * The bound core is used as the constructor argument when registering new tools.
   *
   * @param core - The `KritzelCore` instance this registry is bound to.
   */
  constructor(private readonly core: KritzelCore) {}

  /**
   * Registers a new tool by instantiating it with the registry's bound core.
   * The tool is stored in the registry under the specified name.
   *
   * @param toolName - The unique identifier for the tool.
   * @param constructor - The tool class constructor that extends `KritzelBaseTool`.
   * @returns The newly created and registered tool instance.
   */
  registerTool(toolName: string, constructor: new (core: KritzelCore) => KritzelBaseTool): KritzelBaseTool {
    const toolInstance = new constructor(this.core);
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
  hasTool(toolName: string): boolean {
    return toolName in this.registry;
  }

  /**
   * Retrieves a registered tool by its name.
   * Logs a warning if the tool is not found.
   *
   * @param toolName - The unique identifier of the tool to retrieve.
   * @returns The tool instance if found, or `null` if not registered.
   */
  getTool(toolName: string): KritzelBaseTool | null {
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
  getToolByIndex(index: number): KritzelBaseTool | null {
    return Object.values(this.registry)[index] ?? null;
  }
}
