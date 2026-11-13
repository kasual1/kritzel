import type { UpdrawBaseObject } from '../classes/objects/base-object.class';
import type { UpdrawViewport } from '../classes/core/viewport.class';
import type { UpdrawObjectConfig } from './object-config.interface';
import type { UpdrawObjectElementClickEvent, UpdrawObjectElementHoverEvent, UpdrawObjectElementPickEvent } from './object-element.interface';
import type { UpdrawObjectTitlebarActionEvent, UpdrawObjectTitlebarConfig, UpdrawObjectTitlebarMenuState } from './object-titlebar.interface';
import type { UpdrawObjectChangeSource } from './object-change-event.interface';

/**
 * The part of the `<updraw-engine>` component that {@link UpdrawCore} and its managers use.
 * The engine component implements it, so the core classes don't depend on the component itself.
 * @internal
 */
export interface UpdrawEngineHost {
  /** The `<updraw-engine>` host element. */
  host: HTMLElement;
  /** Titlebar configuration of the engine, see the `objectTitlebar` prop. */
  objectTitlebar?: UpdrawObjectTitlebarConfig;
  /** Object behavior configuration of the engine, see the `objectConfig` prop. */
  objectConfig?: UpdrawObjectConfig;
  /** Counter that the core increments to rerender the engine. */
  forceUpdate: number;
  /** The engine's viewport. */
  viewport: UpdrawViewport;

  triggerSelectionChange(): Promise<void>;
  addObject<T extends UpdrawBaseObject>(object: T): Promise<T | null>;

  emitObjectsChange(): void;
  emitObjectsAdded(objects: UpdrawBaseObject<any>[], source?: UpdrawObjectChangeSource): void;
  emitObjectsRemoved(objects: UpdrawBaseObject<any>[], source?: UpdrawObjectChangeSource): void;
  emitObjectsUpdated(objects: { object: UpdrawBaseObject<any>; changedProperties: string[] }[], source?: UpdrawObjectChangeSource): void;
  emitAwarenessChange(states: Map<number, Record<string, any>>): void;
  emitObjectTitlebarAction(detail: UpdrawObjectTitlebarActionEvent): void;
  emitObjectTitlebarMenuStateChange(detail: UpdrawObjectTitlebarMenuState): void;
  emitObjectElementHover(detail: UpdrawObjectElementHoverEvent): void;
  emitObjectElementClick(detail: UpdrawObjectElementClickEvent): void;
  emitObjectElementPick(detail: UpdrawObjectElementPickEvent): void;
  emitObjectsInViewportChange(): void;
}
