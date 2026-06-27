import { KritzelCustomElement } from '../classes/objects/custom-element.class';

/**
 * Context passed to a renderer when mounting, updating, or unmounting.
 */
export interface KritzelCustomElementRenderContext {
  /** The custom element object being rendered. */
  object: KritzelCustomElement;
  /** Container element to render into (mount) or receive lifecycle notifications (unmount). */
  container: HTMLElement | null;
  /** Custom data payload for the renderer (e.g., component props, state). */
  data?: unknown;
}

/**
 * Renderer implementation for custom elements on the canvas.
 * Handles framework-specific mounting, updating, and cleanup.
 */
export interface KritzelCustomElementRenderer {
  /**
   * Called when the custom element enters the viewport or is first added to canvas.
   * Renderer is responsible for creating and appending DOM to context.container.
   * @param context - Render context with object, container, and data
   */
  onMount(context: KritzelCustomElementRenderContext): void;

  /**
   * Called when object properties (position, size, rotation, etc.) change.
   * Renderer can react to dimension/transform updates or data changes.
   * Optional; default is no-op.
   * @param context - Render context with updated object and data
   * @param changedProperties - Array of property names that changed
   */
  onUpdate?(context: KritzelCustomElementRenderContext, changedProperties: string[]): void;

  /**
   * Called when the object leaves the viewport, is deleted, or workspace is unloaded.
   * Renderer must clean up event listeners, timers, framework instances, and remove DOM.
   * May optionally return updated data to capture back into object.rendererData.
   * @param context - Render context with object and container
   * @returns Optional updated data payload to persist
   */
  onUnmount(context: KritzelCustomElementRenderContext): unknown;
}
