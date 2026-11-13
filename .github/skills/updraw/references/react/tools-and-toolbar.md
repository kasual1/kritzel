# Tools & Toolbar

A *tool* is the active pointer-interaction mode; exactly one is active at a time. The default `<KritzelEditor>` toolbar registers these tools under these names:

| Name | Class | Creates |
|---|---|---|
| `selection` (default active) | `KritzelSelectionTool` | â€” selects/transforms |
| `brush` | `KritzelBrushTool` | `KritzelPath` |
| `eraser` | `KritzelEraserTool` | â€” removes objects |
| `line` | `KritzelLineTool` | `KritzelLine` |
| `shape` | `KritzelShapeTool` | `KritzelShape` |
| `text` | `KritzelTextTool` | `KritzelText` |
| `image` | `KritzelImageTool` | `KritzelImage` |

Tool *names are whatever the toolbar config / `registerTool` call says* â€” when you customize the toolbar, `changeActiveToolByName` must use your names. `<KritzelEngine>` registers none.

## Switching tools

```tsx
await editor.changeActiveToolByName('brush');
// or with an instance (e.g. the return value of registerTool):
await editor.changeActiveToolByName(toolInstance.name);
```

Switching tools clears the current selection. `disable()` / `enable()` turn all canvas interaction off/on (e.g. while a modal is open).

## Tool config interfaces

```ts
interface KritzelBrushToolConfig {
  color: ThemeAwareColor;                 // { light, dark }
  size: number;
  palette: ThemeAwareColor[];             // [] disables the picker
  opacity?: number;                       // highlighters typically ~0.6
}

interface KritzelLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?:   { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}

interface KritzelShapeToolConfig {
  shapeType: ShapeType;
  fillColor: ThemeAwareColor;
  strokeColor: ThemeAwareColor;
  strokeWidth: number;
  fontColor: ThemeAwareColor;
  fontSize: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}

interface KritzelTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}
```

All config types are exported from `@kritzel/react-editor`. Defaults are exported as `DEFAULT_BRUSH_CONFIG` and `DEFAULT_TEXT_CONFIG` â€” spread them to tweak a single field.

## Registering preconfigured tool variants

The most common customization: several variants of a built-in tool under distinct names (e.g. color-locked brushes driven by your own UI):

```tsx
import { KritzelBrushTool, type KritzelBrushToolConfig } from '@kritzel/react-editor';

async function onReady() {
  const editor = editorRef.current;
  if (!editor) return;

  const red: KritzelBrushToolConfig = {
    color: { light: '#ff0000', dark: '#ff6666' },
    size: 16,
    palette: [],                  // empty → no color picker, color is locked
  };
  await editor.registerTool('red-brush', KritzelBrushTool, red);
  await editor.changeActiveToolByName('red-brush');
}
```

`registerTool(name, ToolClass, config?)` returns the tool instance (or the existing one if the name is taken).

## Customizing the toolbar (`toolbarItems` prop)

Replace the editor's toolbar wholesale with a `KritzelToolbarItem[]`. **Define the array at module scope** (or `useMemo`) â€” a fresh array per render re-triggers the toolbar setup:

```tsx
import {
  KritzelSelectionTool, KritzelBrushTool, KritzelTextTool,
  type KritzelToolbarItem,
} from '@kritzel/react-editor';

const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
  {
    name: 'brush', type: 'tool', tool: KritzelBrushTool, icon: 'pen',
    config: {
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 6,
      palette: [
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#087ea4', dark: '#7dd3fc', label: 'Accent' },
      ],
    },
  },
  {
    name: 'highlighter', type: 'tool', tool: KritzelBrushTool, icon: 'highlighter',
    config: {
      color: { light: '#ffeb3b', dark: '#fff176' },
      size: 20, opacity: 0.6,
      palette: [{ light: '#ffeb3b', dark: '#fff176', label: 'Yellow' }],
    },
  },
  {
    name: 'text', type: 'tool', tool: KritzelTextTool, icon: 'type',
    config: {
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 18, fontFamily: 'Arial',
      palette: [{ light: '#1f2937', dark: '#f3f4f6' }],
    },
  },
  { name: 'config', type: 'config' },   // the settings button
];

// in the component:
<KritzelEditor toolbarItems={toolbarItems} ... />
```

Rules:
- Each entry: unique `name`, `type: 'tool' | 'config'`, the tool **class** (not instance), an `icon` name, optional `config`.
- `isDefault: true` marks the tool active on startup (use exactly one).
- The same tool class can appear multiple times under different names/configs.
- `subOptions` adds a per-control option picker, e.g. the shape tool's shape switcher: `{ id, icon, label, value: ShapeType.Ellipse, toolProperty: 'shapeType' }`.
- Icons use the built-in icon names (`cursor`, `pen`, `eraser`, `arrow`, `shape-rectangle`, `type`, `image`, `highlighter`, â€¦). Register custom SVGs via `customSvgIcons={{ name: '<svgâ€¦>' }}`.

To hide the toolbar entirely and drive tools from your own React UI: `isToolbarVisible={false}` + `registerTool`/`changeActiveToolByName`. Mirror the active tool name in `useState` for button highlighting (see the basic-usage demo).

## Fully custom tool classes

For new interaction behavior, extend `KritzelBaseTool` (exported from `@kritzel/react-editor`) and override the lifecycle/pointer hooks:

```tsx
import { KritzelBaseTool } from '@kritzel/react-editor';

export class StampTool extends KritzelBaseTool {
  override onActivate(): void {}
  override onDeactivate(): void {}
  override handlePointerDown(ev: PointerEvent): void { /* place a stamp */ }
  override handlePointerMove(ev: PointerEvent): void {}
  override handlePointerUp(ev: PointerEvent): void {}
  override handleWheel(ev: WheelEvent): void {}
}

const tool = await editor.registerTool('stamp', StampTool);
await editor.changeActiveToolByName(tool!.name);
```
