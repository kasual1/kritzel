import type { UpdrawCore } from '../classes/core/core.class';
import type { UpdrawBaseTool } from '../classes/tools/base-tool.class';
import type {
  UpdrawAgenticColor,
  UpdrawAgenticLineStyle,
  UpdrawAgenticShapeStyle,
  UpdrawAgenticStrokeStyle,
  UpdrawAgenticTextStyle,
} from '../interfaces/agentic-action.interface';
import type { LineArrowConfig } from '../interfaces/arrow-head.interface';
import { DEFAULT_COLOR_PALETTE, type ThemeAwareColor } from '../constants/color-palette.constants';
import { ShapeType } from '../enums/shape-type.enum';

/** The first registered tool of a type. Tool names are configurable, so tools are matched by type. */
export function findToolByType(core: UpdrawCore, toolType: string): UpdrawBaseTool | null {
  const registry = core.toolRegistry;
  if (!registry) {
    return null;
  }
  for (let index = 0; ; index++) {
    const tool = registry.getToolByIndex(index);
    if (!tool) {
      return null;
    }
    if (tool.toolType === toolType) {
      return tool;
    }
  }
}

/** A CSS color string applies to both themes. */
export function toThemeColor(color: UpdrawAgenticColor | undefined): ThemeAwareColor | undefined {
  if (color === undefined) {
    return undefined;
  }
  return typeof color === 'string' ? { light: color, dark: color } : color;
}

function read<T>(tool: UpdrawBaseTool | null, key: string, fallback: T): T {
  const value = tool ? (tool as unknown as Record<string, unknown>)[key] : undefined;
  return value === undefined || value === null ? fallback : (value as T);
}

/** Resolved style of an agent-created shape. */
export interface UpdrawResolvedShapeStyle {
  shapeType: ShapeType;
  fillColor: ThemeAwareColor;
  strokeColor: ThemeAwareColor;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontColor: ThemeAwareColor;
}

/** Style for an agent shape: the overrides, else the shape tool's current settings. */
export function resolveShapeStyle(core: UpdrawCore, style: UpdrawAgenticShapeStyle = {}, shapeType?: string): UpdrawResolvedShapeStyle {
  const tool = findToolByType(core, 'shape');
  return {
    shapeType: (shapeType as ShapeType) ?? read(tool, 'shapeType', ShapeType.Rectangle),
    fillColor: toThemeColor(style.fillColor) ?? read(tool, 'fillColor', { light: 'transparent', dark: 'transparent' }),
    strokeColor: toThemeColor(style.strokeColor) ?? read(tool, 'strokeColor', DEFAULT_COLOR_PALETTE[0]),
    strokeWidth: style.strokeWidth ?? read(tool, 'strokeWidth', 4),
    opacity: style.opacity ?? read(tool, 'opacity', 1),
    fontSize: style.fontSize ?? read(tool, 'fontSize', 16),
    fontFamily: style.fontFamily ?? read(tool, 'fontFamily', 'Arial'),
    fontColor: toThemeColor(style.fontColor) ?? read(tool, 'fontColor', DEFAULT_COLOR_PALETTE[0]),
  };
}

/** Resolved style of agent-created text. */
export interface UpdrawResolvedTextStyle {
  fontSize: number;
  fontFamily: string;
  fontColor: ThemeAwareColor;
  opacity: number;
}

/** Style for agent text: the overrides, else the text tool's defaults (never the text being edited). */
export function resolveTextStyle(core: UpdrawCore, style: UpdrawAgenticTextStyle = {}): UpdrawResolvedTextStyle {
  const tool = findToolByType(core, 'text');
  return {
    fontSize: style.fontSize ?? read(tool, 'defaultFontSize', 16),
    fontFamily: style.fontFamily ?? read(tool, 'defaultFontFamily', 'Arial'),
    fontColor: toThemeColor(style.fontColor) ?? read(tool, 'defaultFontColor', DEFAULT_COLOR_PALETTE[0]),
    opacity: style.opacity ?? read(tool, 'defaultOpacity', 1),
  };
}

/** Resolved style of an agent stroke or line. */
export interface UpdrawResolvedStrokeStyle {
  color: ThemeAwareColor;
  strokeWidth: number;
  opacity: number;
  arrows?: LineArrowConfig;
}

/** Style for an agent freehand path: the overrides, else the brush tool's current settings. */
export function resolveBrushStyle(core: UpdrawCore, style: UpdrawAgenticStrokeStyle = {}): UpdrawResolvedStrokeStyle {
  const tool = findToolByType(core, 'brush');
  return {
    color: toThemeColor(style.strokeColor) ?? read(tool, 'color', DEFAULT_COLOR_PALETTE[0]),
    strokeWidth: style.strokeWidth ?? read(tool, 'size', 6),
    opacity: style.opacity ?? read(tool, 'opacity', 1),
  };
}

/** Style for an agent line: the overrides, else the line tool's current settings. */
export function resolveLineStyle(core: UpdrawCore, style: UpdrawAgenticLineStyle = {}): UpdrawResolvedStrokeStyle {
  const tool = findToolByType(core, 'line');
  return {
    color: toThemeColor(style.strokeColor) ?? read(tool, 'color', DEFAULT_COLOR_PALETTE[0]),
    strokeWidth: style.strokeWidth ?? read(tool, 'size', 4),
    opacity: style.opacity ?? read(tool, 'opacity', 1),
    arrows: style.arrows ?? read<LineArrowConfig | undefined>(tool, 'arrows', undefined),
  };
}
