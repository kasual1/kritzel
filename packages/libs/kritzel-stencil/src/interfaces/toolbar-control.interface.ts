import { KritzelBaseTool } from '../classes/tools/base-tool.class';
import { KritzelIconName } from '../enums/icon-name.enum';

export interface KritzelToolbarControl {
  name: string;
  class: new (...args: any[]) => KritzelBaseTool;
  icon: KritzelIconName;
  isDefault?: boolean;
}
