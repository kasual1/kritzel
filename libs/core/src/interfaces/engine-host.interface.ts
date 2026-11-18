import type { UpmadeBaseObject } from '../classes/objects/base-object.class';
import type { UpmadeViewport } from '../classes/core/viewport.class';
import type { UpmadeObjectConfig } from './object-config.interface';
import type { UpmadeObjectElementClickEvent, UpmadeObjectElementHoverEvent, UpmadeObjectElementPickEvent } from './object-element.interface';
import type { UpmadeObjectTitlebarActionEvent, UpmadeObjectTitlebarConfig, UpmadeObjectTitlebarMenuState } from './object-titlebar.interface';
import type { UpmadeObjectChangeSource } from './object-change-event.interface';

/**
 * The part of the `<upmade-engine>` component that {@link UpmadeCore} and its managers use.
 * The engine component implements it, so the core classes don't depend on the component itself.
 * @internal
 */
export interface UpmadeEngineHost {
  /** The `<upmade-engine>` host element. */
  host: HTMLElement;
  /** Titlebar configuration of the engine, see the `objectTitlebar` prop. */
  objectTitlebar?: UpmadeObjectTitlebarConfig;
  /** Object behavior configuration of the engine, see the `objectConfig` prop. */
  objectConfig?: UpmadeObjectConfig;
  /** Counter that the core increments to rerender the engine. */
  forceUpdate: number;
  /** The engine's viewport. */
  viewport: UpmadeViewport;

  triggerSelectionChange(): Promise<void>;
  addObject<T extends UpmadeBaseObject>(object: T): Promise<T | null>;

  emitObjectsChange(): void;
  emitObjectsAdded(objects: UpmadeBaseObject<any>[], source?: UpmadeObjectChangeSource): void;
  emitObjectsRemoved(objects: UpmadeBaseObject<any>[], source?: UpmadeObjectChangeSource): void;
  emitObjectsUpdated(objects: { object: UpmadeBaseObject<any>; changedProperties: string[] }[], source?: UpmadeObjectChangeSource): void;
  emitAwarenessChange(states: Map<number, Record<string, any>>): void;
  emitObjectTitlebarAction(detail: UpmadeObjectTitlebarActionEvent): void;
  emitObjectTitlebarMenuStateChange(detail: UpmadeObjectTitlebarMenuState): void;
  emitObjectElementHover(detail: UpmadeObjectElementHoverEvent): void;
  emitObjectElementClick(detail: UpmadeObjectElementClickEvent): void;
  emitObjectElementPick(detail: UpmadeObjectElementPickEvent): void;
  emitObjectsInViewportChange(): void;
}
