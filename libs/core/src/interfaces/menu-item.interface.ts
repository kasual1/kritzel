import { KritzelIconName } from '../classes/registries/icon-registry.class';

export interface IKritzelMenuItem<T = any> {
  id: string;
  label: string;
  icon?: KritzelIconName;
  iconTooltip?: string;
  color?: string;
  value?: T;
  children?: IKritzelMenuItem[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isVisible?: boolean | (() => boolean | Promise<boolean>);
  isChildMenuOpen?: boolean;
  isNewItem?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<IKritzelMenuItem>;
  action?: (item: IKritzelMenuItem, parent: IKritzelMenuItem) => void;
}

export interface IKritzelMenuItemSelectEvent {
  item: IKritzelMenuItem;
  parent: IKritzelMenuItem;
}

export interface IKritzelMenuItemToggleChildMenuEvent {
  item: IKritzelMenuItem;
  childMenuAnchor: HTMLElement;
}
