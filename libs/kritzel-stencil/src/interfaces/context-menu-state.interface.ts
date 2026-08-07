import { KritzelBaseObject } from '../classes/objects/base-object.class';
import { ContextMenuItem } from './context-menu-item.interface';

export interface KritzelContextMenuState {
  isVisible: boolean;
  isObjectMenu: boolean;
  items: ContextMenuItem[];
  objects: KritzelBaseObject[];
  position: {
    x: number;
    y: number;
  };
  worldPosition: {
    x: number;
    y: number;
  };
}