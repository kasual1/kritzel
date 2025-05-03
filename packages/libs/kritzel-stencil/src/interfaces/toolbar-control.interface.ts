import { KritzelBaseTool } from '../classes/tools/base-tool.class';

interface KritzelToolbarControlBase {
  name: string;
}

interface KritzelToolbarToolControl extends KritzelToolbarControlBase {
  type: 'tool';
  tool: new (...args: any[]) => KritzelBaseTool;
  icon: string;
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