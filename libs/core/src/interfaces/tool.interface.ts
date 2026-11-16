import { UpmadeBaseTool } from '../classes/tools/base-tool.class';
import { UpmadeBrushToolConfig, UpmadeLineToolConfig, UpmadeShapeToolConfig, UpmadeTextToolConfig } from './toolbar-item.interface';

export type UpmadeToolConstructor = new (...args: any[]) => UpmadeBaseTool;

export type UpmadeToolConfig = UpmadeTextToolConfig | UpmadeBrushToolConfig | UpmadeLineToolConfig | UpmadeShapeToolConfig;

export interface UpmadeToolDefinition {
  name: string;
  tool: UpmadeToolConstructor | UpmadeBaseTool;
  config?: UpmadeToolConfig;
}export interface UpmadeTool {
  name: string;
  toolType: string;
  handlePointerDown(event: PointerEvent): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
  handleWheel(event: WheelEvent): void;
}
