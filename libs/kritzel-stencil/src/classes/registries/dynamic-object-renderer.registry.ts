import { KritzelDynamicObjectRenderer } from "../../interfaces/dynamic-object-renderer.interface";

type KritzelRendererRegistryStore = {
  renderers: Map<string, KritzelDynamicObjectRenderer>;
};

const KRITZEL_RENDERER_REGISTRY_KEY = '__kritzelDynamicObjectRendererRegistry__';

const getGlobalRegistryStore = (): KritzelRendererRegistryStore => {
  const globalScope = globalThis as unknown as Record<string, unknown>;
  const existing = globalScope[KRITZEL_RENDERER_REGISTRY_KEY] as KritzelRendererRegistryStore | undefined;

  if (existing) {
    return existing;
  }

  const created: KritzelRendererRegistryStore = {
    renderers: new Map<string, KritzelDynamicObjectRenderer>(),
  };
  globalScope[KRITZEL_RENDERER_REGISTRY_KEY] = created;
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
export class KritzelDynamicObjectRendererRegistry {
  private static get _renderers(): Map<string, KritzelDynamicObjectRenderer> {
    return getGlobalRegistryStore().renderers;
  }

  /**
   * Registers a renderer implementation for a given key.
   * @param key - Stable identifier for this renderer (e.g., 'angular-my-component')
   * @param renderer - Renderer implementation with mount/unmount/update handlers
   */
  static register(key: string, renderer: KritzelDynamicObjectRenderer): void {
    this._renderers.set(key, renderer);
  }

  /**
   * Retrieves a registered renderer by key.
   * @param key - Renderer identifier
   * @returns The registered renderer, or undefined if not found
   */
  static get(key: string): KritzelDynamicObjectRenderer | undefined {
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
