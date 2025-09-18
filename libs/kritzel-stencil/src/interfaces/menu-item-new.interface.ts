export interface IKritzelMenuItem<T = any> {
  id: string;
  label: string;
  data?: T;
  children?: IKritzelMenuItem[];
  isSelectable?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  isDisabled?: boolean;
  isChildMenuOpen?: boolean;
  childMenuAnchor?: HTMLElement;
  unchangedState?: Partial<IKritzelMenuItem>;
}
