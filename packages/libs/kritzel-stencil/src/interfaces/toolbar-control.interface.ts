import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { KritzelIconName } from '../enums/icon-name.enum';

export interface KritzelToolbarControlBase {
  name: string;
  isDefault?: boolean;
}

export interface KritzelToolbarControlTool extends KritzelToolbarControlBase {
  icon: KritzelIconName;
  tool: new (...args: any[]) => KritzelBaseTool;
}

export interface KritzelToolbarControlDivider extends KritzelToolbarControlBase {
}

export interface KritzelToolbarControlConfig extends KritzelToolbarControlBase {
}