---
sidebar_label: Built-in Tools
title: "Built-in Tools | Kritzel for React"
description: "All built-in tools provided by Kritzel: brush, eraser, selection, line, shape, text, and image."
---
# Built-in Tools

Kritzel includes seven built-in drawing tools. All tools extend `KritzelBaseTool` and are registered with the engine via `registerTool()`.

## Default Toolbar

The `<KritzelEditor>` component registers these tools by default:

| Tool | Class | Icon | Creates |
|------|-------|------|---------|
| Selection | `KritzelSelectionTool` | `cursor` | — |
| Brush | `KritzelBrushTool` | `pen` | `KritzelPath` |
| Line | `KritzelLineTool` | `arrow` | `KritzelLine` |
| Eraser | `KritzelEraserTool` | `eraser` | — (removes paths) |
| Text | `KritzelTextTool` | `type` | `KritzelText` |
| Shape | `KritzelShapeTool` | `shape-rectangle` | `KritzelShape` |
| Image | `KritzelImageTool` | `image` | `KritzelImage` |

## Selection Tool

`KritzelSelectionTool` — the default tool. Allows selecting, moving, resizing, and rotating objects.

- Click an object to select it
- Drag on empty canvas to lasso-select
- Drag selected objects to move
- Use corner handles to resize
- Use the rotation handle to rotate
- Supports multi-select with lasso

## Brush Tool

`KritzelBrushTool` — freehand drawing. Creates `KritzelPath` objects rendered as SVG paths using the [perfect-freehand](https://github.com/steveruizok/perfect-freehand) library.

### Configuration (`KritzelBrushToolConfig`)

```ts
interface KritzelBrushToolConfig {
  type: 'pen' | 'highlighter';
  color: ThemeAwareColor;
  size: number;
  palettes: {
    [brushType: string]: ThemeAwareColor[];
  };
}
```

### Defaults

| Property | Default |
|----------|---------|
| `type` | `'pen'` |
| `color` | `{ light: '#000000', dark: '#ffffff' }` |
| `size` | `16` |

## Line Tool

`KritzelLineTool` — draws straight lines and arrows. Creates `KritzelLine` objects that support anchor snapping to other objects.

### Configuration (`KritzelLineToolConfig`)

```ts
interface KritzelLineToolConfig {
  color: ThemeAwareColor;
  size: number;
  palette: ThemeAwareColor[];
  arrows?: {
    start?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
    end?: { enabled: boolean; style?: 'triangle' | 'open' | 'diamond' | 'circle' };
  };
}
```

### Defaults

| Property | Default |
|----------|---------|
| `color` | `{ light: '#000000', dark: '#ffffff' }` |
| `size` | `4` |
| `arrows.end` | `{ enabled: true, style: 'triangle' }` |

## Shape Tool

`KritzelShapeTool` — draws rectangles, ellipses, and triangles. Creates `KritzelShape` objects that can contain text.

### Configuration (`KritzelShapeToolConfig`)

```ts
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
```

### Defaults

| Property | Default |
|----------|---------|
| `shapeType` | `ShapeType.Rectangle` |
| `fillColor` | `{ light: 'transparent', dark: 'transparent' }` |
| `strokeColor` | `{ light: '#000000', dark: '#ffffff' }` |
| `strokeWidth` | `4` |
| `fontFamily` | `'Arial'` |
| `fontSize` | `16` |

### Shape Types

```ts
enum ShapeType {
  Rectangle = 'rectangle',
  Ellipse   = 'ellipse',
  Triangle  = 'triangle',
}
```

The default toolbar includes sub-options for switching between shape types.

## Text Tool

`KritzelTextTool` — text input. Creates `KritzelText` objects powered by ProseMirror for rich text editing.

### Configuration (`KritzelTextToolConfig`)

```ts
interface KritzelTextToolConfig {
  color: ThemeAwareColor;
  size: number;
  fontFamily: string;
  palette: ThemeAwareColor[];
}
```

### Defaults

| Property | Default |
|----------|---------|
| `color` | `{ light: '#000000', dark: '#ffffff' }` |
| `size` | `8` |
| `fontFamily` | `'Arial'` |

## Image Tool

`KritzelImageTool` — inserts images onto the canvas. Creates `KritzelImage` objects. Opens a file picker when the tool is activated.

## Eraser Tool

`KritzelEraserTool` — removes `KritzelPath` objects under the pointer. Does not create new objects.

## Registering a Custom Tool

You can register additional tools using the `registerTool()` method:

```ts
const editor = document.querySelector('kritzel-editor');

const tool = await editor.registerTool('my-tool', MyCustomToolClass, {
  // optional config
});

// Switch to the custom tool
await editor.changeActiveTool(tool);
```

Custom tools should extend `KritzelBaseTool` and implement the pointer event handlers:

- `onActivate()` — called when the tool becomes active
- `onDeactivate()` — called when the tool is deactivated
- `handlePointerDown(event)` — pointer press
- `handlePointerMove(event)` — pointer move
- `handlePointerUp(event)` — pointer release
- `handleWheel(event)` — scroll wheel

## Customizing the Toolbar

Pass a custom `toolbar` prop to `<KritzelEditor>` to change which tools appear:

```ts
import { KritzelBrushTool, KritzelSelectionTool, KritzelEraserTool } from 'kritzel-react';

const toolbar = [
  { name: 'selection', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
  { name: 'brush', type: 'tool', tool: KritzelBrushTool, icon: 'pen' },
  { name: 'eraser', type: 'tool', tool: KritzelEraserTool, icon: 'eraser' },
  { name: 'config', type: 'config' },
];
```
