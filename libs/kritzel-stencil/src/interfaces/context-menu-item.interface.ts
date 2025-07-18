import { KritzelBaseObject } from "../classes/objects/base-object.class";

export interface ContextMenuItem {
  label: string;
  action: (menu: { x: number; y: number }, objects: KritzelBaseObject[]) => void;
  icon?: string;
  visible?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
  disabled?: boolean | ((menu: { x: number; y: number }, objects: KritzelBaseObject[]) => boolean | Promise<boolean>);
}
