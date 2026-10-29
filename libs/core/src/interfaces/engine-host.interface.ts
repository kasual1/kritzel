import type { KritzelBaseObject } from '../classes/objects/base-object.class';
import type { KritzelViewport } from '../classes/core/viewport.class';
import type { KritzelObjectConfig } from './object-config.interface';
import type { KritzelObjectTitlebarActionEvent, KritzelObjectTitlebarConfig, KritzelObjectTitlebarMenuState } from './object-titlebar.interface';

/**
 * The part of the `<kritzel-engine>` component that {@link KritzelCore} and its managers use.
 * The engine component implements it, so the core classes don't depend on the component itself.
 * @internal
 */
export interface KritzelEngineHost {
  /** The `<kritzel-engine>` host element. */
  host: HTMLElement;
  /** Titlebar configuration of the engine, see the `objectTitlebar` prop. */
  objectTitlebar?: KritzelObjectTitlebarConfig;
  /** Object behavior configuration of the engine, see the `objectConfig` prop. */
  objectConfig?: KritzelObjectConfig;
  /** Counter that the core increments to rerender the engine. */
  forceUpdate: number;
  /** The engine's viewport. */
  viewport: KritzelViewport;

  triggerSelectionChange(): Promise<void>;
  addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>;

  emitObjectsChange(): void;
  emitObjectsAdded(objects: KritzelBaseObject<any>[]): void;
  emitObjectsRemoved(objects: KritzelBaseObject<any>[]): void;
  emitObjectsUpdated(objects: { object: KritzelBaseObject<any>; changedProperties: string[] }[]): void;
  emitAwarenessChange(states: Map<number, Record<string, any>>): void;
  emitObjectTitlebarAction(detail: KritzelObjectTitlebarActionEvent): void;
  emitObjectTitlebarMenuStateChange(detail: KritzelObjectTitlebarMenuState): void;
  emitObjectsInViewportChange(): void;
}
