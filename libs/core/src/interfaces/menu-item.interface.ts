import { UpmadeIconName } from '../classes/registries/icon-registry.class';

export interface IUpmadeMenuItem<T = any> {
  id: string;
  label: string;
  icon?: UpmadeIconName;
  iconTooltip?: string;
  color?: string;
  value?: T;
  children?: IUpmadeMenuItem[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isVisible?: boolean | (() => boolean | Promise<boolean>);
  isChildMenuOpen?: boolean;
  isNewItem?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<IUpmadeMenuItem>;
  action?: (item: IUpmadeMenuItem, parent: IUpmadeMenuItem) => void;
}

export interface IUpmadeMenuItemSelectEvent {
  item: IUpmadeMenuItem;
  parent: IUpmadeMenuItem;
}

export interface IUpmadeMenuItemToggleChildMenuEvent {
  item: IUpmadeMenuItem;
  childMenuAnchor: HTMLElement;
}
