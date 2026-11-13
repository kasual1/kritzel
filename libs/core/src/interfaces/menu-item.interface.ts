import { UpdrawIconName } from '../classes/registries/icon-registry.class';

export interface IUpdrawMenuItem<T = any> {
  id: string;
  label: string;
  icon?: UpdrawIconName;
  iconTooltip?: string;
  color?: string;
  value?: T;
  children?: IUpdrawMenuItem[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isVisible?: boolean | (() => boolean | Promise<boolean>);
  isChildMenuOpen?: boolean;
  isNewItem?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<IUpdrawMenuItem>;
  action?: (item: IUpdrawMenuItem, parent: IUpdrawMenuItem) => void;
}

export interface IUpdrawMenuItemSelectEvent {
  item: IUpdrawMenuItem;
  parent: IUpdrawMenuItem;
}

export interface IUpdrawMenuItemToggleChildMenuEvent {
  item: IUpdrawMenuItem;
  childMenuAnchor: HTMLElement;
}
