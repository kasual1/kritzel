import { KritzelBaseObject } from "../classes/objects/base-object.class";
import { KritzelIconName } from "../classes/registries/icon-registry.class";
import { KritzelTermKey } from "./localization.interface";

export interface ContextMenuItem {
  /**
   * The item label. Always resolved through the active locale: pass a
   * {@link KritzelTermKey} (e.g. `'menu.copy'`) to display its translation, or
   * any other string to use it verbatim. Known term keys are autocompleted.
   */
  label: KritzelTermKey | (string & NonNullable<unknown>);
  action?: (menu: { x: number; y: number }, objects: KritzelBaseObject[]) => void;
  icon?: KritzelIconName;
  group?: string;
  children?: ContextMenuItem[];
  isVisible?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
  isDisabled?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
}
