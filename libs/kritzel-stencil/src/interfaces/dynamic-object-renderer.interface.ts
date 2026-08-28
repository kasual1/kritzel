import { KritzelDynamicObject } from '../classes/objects/dynamic-object.class';

/**
 * Context passed to a renderer when mounting, updating, or unmounting.
 */
export interface KritzelDynamicObjectRenderContext {
  /** The dynamic object object being rendered. */
  object: KritzelDynamicObject;
  /** Container element to render into (mount) or receive lifecycle notifications (unmount). */
  container: HTMLElement | null;
  /** Custom data payload for the renderer (e.g., component props, state). */
  data?: unknown;
}

/**
 * Renderer implementation for dynamic objects on the canvas.
 * Handles framework-specific mounting, updating, and cleanup.
 */
export interface KritzelDynamicObjectRenderer {
  /**
   * Called when the dynamic object enters the viewport or is first added to canvas.
   * Renderer is responsible for creating and appending DOM to context.container.
   * @param context - Render context with object, container, and data
   */
  onMount(context: KritzelDynamicObjectRenderContext): void;

  /**
   * Called when object properties (position, size, rotation, etc.) change.
   * Renderer can react to dimension/transform updates or data changes.
   * Optional; default is no-op.
   * @param context - Render context with updated object and data
   * @param changedProperties - Array of property names that changed
   */
  onUpdate?(context: KritzelDynamicObjectRenderContext, changedProperties: string[]): void;

  /**
   * Called when the object leaves the viewport, is deleted, or workspace is unloaded.
   * Renderer must clean up event listeners, timers, framework instances, and remove DOM.
   * May optionally return updated data to capture back into object.rendererData.
   * @param context - Render context with object and container
   * @returns Optional updated data payload to persist
   */
  onUnmount(context: KritzelDynamicObjectRenderContext): unknown;
}
