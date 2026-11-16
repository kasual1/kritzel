import { UpmadeBaseObject } from '../classes/objects/base-object.class';
import { ContextMenuItem } from './context-menu-item.interface';

export interface UpmadeContextMenuState {
  isVisible: boolean;
  isObjectMenu: boolean;
  items: ContextMenuItem[];
  objects: UpmadeBaseObject[];
  position: {
    x: number;
    y: number;
  };
  worldPosition: {
    x: number;
    y: number;
  };
}