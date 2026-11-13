import { UpdrawBaseTool } from '../classes/tools/base-tool.class';
import { UpdrawBrushToolConfig, UpdrawLineToolConfig, UpdrawShapeToolConfig, UpdrawTextToolConfig } from './toolbar-item.interface';

export type UpdrawToolConstructor = new (...args: any[]) => UpdrawBaseTool;

export type UpdrawToolConfig = UpdrawTextToolConfig | UpdrawBrushToolConfig | UpdrawLineToolConfig | UpdrawShapeToolConfig;

export interface UpdrawToolDefinition {
  name: string;
  tool: UpdrawToolConstructor | UpdrawBaseTool;
  config?: UpdrawToolConfig;
}export interface UpdrawTool {
  name: string;
  toolType: string;
  handlePointerDown(event: PointerEvent): void;
  handlePointerMove(event: PointerEvent): void;
  handlePointerUp(event: PointerEvent): void;
  handleWheel(event: WheelEvent): void;
}
