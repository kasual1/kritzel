import { UpdrawDynamicObjectRenderer } from "../../interfaces/dynamic-object-renderer.interface";

type UpdrawRendererRegistryStore = {
  renderers: Map<string, UpdrawDynamicObjectRenderer>;
};

const UPDRAW_RENDERER_REGISTRY_KEY = '__updrawDynamicObjectRendererRegistry__';

const getGlobalRegistryStore = (): UpdrawRendererRegistryStore => {
  const globalScope = globalThis as unknown as Record<string, unknown>;
  const existing = globalScope[UPDRAW_RENDERER_REGISTRY_KEY] as UpdrawRendererRegistryStore | undefined;

  if (existing) {
    return existing;
  }

  const created: UpdrawRendererRegistryStore = {
    renderers: new Map<string, UpdrawDynamicObjectRenderer>(),
  };
  globalScope[UPDRAW_RENDERER_REGISTRY_KEY] = created;
  return created;
};

/**
 * Global registry for dynamic object renderers.
 * Allows wrapper frameworks (Angular, React, Vue) to register renderer implementations
 * without coupling to core, and enables deterministic rehydration across reloads and
 * clipboard paste operations.
 *
 * Renderer keys are opaque strings that must be stable (e.g., 'angular-todo', 'react-editor').
 * When a dynamic object is deserialized with a rendererKey, the registry is consulted to
 * resolve the renderer and mount with the persisted rendererData.
 */
export class UpdrawDynamicObjectRendererRegistry {
  private static get _renderers(): Map<string, UpdrawDynamicObjectRenderer> {
    return getGlobalRegistryStore().renderers;
  }

  /**
   * Registers a renderer implementation for a given key.
   * @param key - Stable identifier for this renderer (e.g., 'angular-my-component')
   * @param renderer - Renderer implementation with mount/unmount/update handlers
   */
  static register(key: string, renderer: UpdrawDynamicObjectRenderer): void {
    this._renderers.set(key, renderer);
  }

  /**
   * Retrieves a registered renderer by key.
   * @param key - Renderer identifier
   * @returns The registered renderer, or undefined if not found
   */
  static get(key: string): UpdrawDynamicObjectRenderer | undefined {
    return this._renderers.get(key);
  }

  /**
   * Unregisters a renderer by key.
   * @param key - Renderer identifier to remove
   * @returns True if the renderer was found and removed; false otherwise
   */
  static unregister(key: string): boolean {
    return this._renderers.delete(key);
  }
}
