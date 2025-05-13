import { KritzelBaseTool } from "../classes/tools/base-tool.class";

interface KritzelBaseToolbarControl {
  name: string;
  config?: {
    color?: string;
    size?: number;
    fontFamily?: string;
  }
}

interface KritzelToolbarToolControl extends KritzelBaseToolbarControl {
  type: 'tool';
  tool: (new (...args: any[]) => KritzelBaseTool) | KritzelBaseTool;
  icon: string;
  isDefault?: boolean;
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