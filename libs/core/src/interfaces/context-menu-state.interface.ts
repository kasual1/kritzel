import { UpdrawBaseObject } from '../classes/objects/base-object.class';
import { ContextMenuItem } from './context-menu-item.interface';

export interface UpdrawContextMenuState {
  isVisible: boolean;
  isObjectMenu: boolean;
  items: ContextMenuItem[];
  objects: UpdrawBaseObject[];
  position: {
    x: number;
    y: number;
  };
  worldPosition: {
    x: number;
    y: number;
  };
}