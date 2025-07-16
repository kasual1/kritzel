export interface ContextMenuItem {
  label: string;
  action: (menu: { x: number; y: number }) => void;
  icon?: string;
  disabled?: boolean | (() => boolean | Promise<boolean>);
}
