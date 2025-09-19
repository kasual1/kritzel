export interface IKritzelMenuItem<T = any> {
  id: string;
  label: string;
  value?: T;
  children?: IKritzelMenuItem[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isChildMenuOpen?: boolean;
  isNewItem?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<IKritzelMenuItem>;
  action?: (item: IKritzelMenuItem, parent: IKritzelMenuItem) => void;
}
