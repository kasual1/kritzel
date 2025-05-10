import { KritzelBaseTool } from '../classes/tools/base-tool.class';

interface KritzelBaseToolbarControl {
  name: string;
}

interface KritzelToolbarToolControl extends KritzelBaseToolbarControl {
  type: 'tool';
  tool: new (...args: any[]) => KritzelBaseTool;
  icon: string;
  isDefault?: boolean;
  config?: {
    color?: string;
    size?: number;
    fontFamily?: string;
  }
}

interface KritzelToolbarDividerControl extends KritzelBaseToolbarControl {
  type: 'divider';
}

interface KritzelToolbarConfigControl extends KritzelBaseToolbarControl {
  type: 'config';
}

export type KritzelToolbarControl =
  | KritzelToolbarToolControl
  | KritzelToolbarDividerControl
  | KritzelToolbarConfigControl;