import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { KritzelIconName } from '../enums/icon-name.enum';

interface KritzelToolbarControlBase {
  name: string;
  onClick?: (control: KritzelToolbarControl, event: MouseEvent) => void;
  onChange?: (control: KritzelToolbarControl) => void;
}

interface KritzelToolbarToolControl extends KritzelToolbarControlBase {
  type: 'tool';
  tool: new (...args: any[]) => KritzelBaseTool;
  icon: KritzelIconName;
  isDefault?: boolean;
  config?: {
    color?: string;
    size?: number;
  }
}

interface KritzelToolbarDividerControl extends KritzelToolbarControlBase {
  type: 'divider';
}

interface KritzelToolbarConfigControl extends KritzelToolbarControlBase {
  type: 'config';
}

export type KritzelToolbarControl =
  | KritzelToolbarToolControl
  | KritzelToolbarDividerControl
  | KritzelToolbarConfigControl;