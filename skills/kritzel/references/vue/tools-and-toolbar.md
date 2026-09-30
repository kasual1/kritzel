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

Tool *names are whatever the toolbar config / `registerTool` call says* â€” when you customize the toolbar, `changeActiveToolByName` must use your names. `<KritzelEngine>` registers none â€” with the engine, register every tool yourself (e.g. `await engine.value.registerTool('brush', KritzelBrushTool)` in the `@isEngineReady` handler, using `getEngineRef`).

In the snippets below, `editor` is the computed ref to the native element (`getEditorRef('editor')` at the top level of `<script setup>`, paired with `<KritzelEditor ref="editor">` â€” see objects.md).

## Switching tools

```ts
await editor.value?.changeActiveToolByName('brush');
// or with an instance (e.g. the return value of registerTool):
await editor.value?.changeActiveToolByName(toolInstance.name);
```

Switching tools clears the current selection. `disable()` / `enable()` turn all canvas interaction off/on (e.g. while a modal is open):

```ts
await editor.value?.disable();
// ... modal open ...
await editor.value?.enable();
```

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

All config types are exported from `@kritzel/vue-editor`. Defaults are exported as `DEFAULT_BRUSH_CONFIG` and `DEFAULT_TEXT_CONFIG` â€” spread them to tweak a single field.

## Registering preconfigured tool variants

The most common customization: several variants of a built-in tool under distinct names (e.g. color-locked brushes driven by your own UI):

```vue
<script setup lang="ts">
import { KritzelBrushTool, KritzelEditor, getEditorRef, type KritzelBrushToolConfig } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')

const red: KritzelBrushToolConfig = {
  color: { light: '#ff0000', dark: '#ff6666' },
  size: 16,
  palette: [],                 // empty → no color picker, color is locked
}

async function onReady() {
  if (!editor.value) return
  await editor.value.registerTool('red-brush', KritzelBrushTool, red)
  await editor.value.changeActiveToolByName('red-brush')
}
</script>

<template>
  <KritzelEditor ref="editor" @isReady="onReady" />
</template>
```

`registerTool(name, ToolClass, config?)` returns the tool instance (or the existing one if the name is taken).

## Customizing the toolbar (`toolbarItems` prop)

Replace the editor's toolbar wholesale with a `KritzelToolbarItem[]`. **Define the array as a `const` in `<script setup>`** â€” never inline in the template (an inline literal is recreated every render and re-triggers the toolbar setup):

```vue
<script setup lang="ts">
import {
  KritzelEditor, KritzelSelectionTool, KritzelBrushTool, KritzelTextTool,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'

const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', isDefault: true, tool: KritzelSelectionTool, icon: 'cursor' },
  {
    name: 'brush', type: 'tool', tool: KritzelBrushTool, icon: 'pen',
    config: {
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 6,
      palette: [
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#42b883', dark: '#7ee2b8', label: 'Accent' },
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
]
</script>

<template>
  <KritzelEditor :toolbarItems="toolbarItems" />
</template>
```

Rules:
- Each entry: unique `name`, `type: 'tool' | 'config'`, the tool **class** (not instance), an `icon` name, optional `config`.
- `isDefault: true` marks the tool active on startup (use exactly one).
- The same tool class can appear multiple times under different names/configs.
- `subOptions` adds a per-control option picker, e.g. the shape tool's shape switcher: `{ id, icon, label, value: ShapeType.Ellipse, toolProperty: 'shapeType' }`.
- Icons use the built-in icon names (`cursor`, `pen`, `eraser`, `arrow`, `shape-rectangle`, `type`, `image`, `highlighter`, â€¦). Register custom SVGs via the `customSvgIcons` prop (`:customSvgIcons="customSvgIcons"` with a `{ name: '<svgâ€¦>' }` const in `<script setup>`).

To hide the toolbar entirely and drive tools from your own Vue UI: `:isToolbarVisible="false"` + `registerTool`/`changeActiveToolByName`. Mirror the active tool name in a `ref()` for button highlighting:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { KritzelEditor, getEditorRef } from '@kritzel/vue-editor'

const editor = getEditorRef('editor')
const activeTool = ref('select')

async function setTool(name: string) {
  activeTool.value = name
  await editor.value?.changeActiveToolByName(name)
}
</script>

<template>
  <button v-for="name in ['select', 'brush', 'eraser']" :key="name"
    :class="{ active: activeTool === name }" @click="setTool(name)">
    {{ name }}
  </button>
  <KritzelEditor ref="editor" :isToolbarVisible="false" />
</template>
```

## Fully custom tool classes

For new interaction behavior, extend `KritzelBaseTool` (exported from `@kritzel/vue-editor`) and override the lifecycle/pointer hooks:

```ts
import { KritzelBaseTool } from '@kritzel/vue-editor';

export class StampTool extends KritzelBaseTool {
  override onActivate(): void {}
  override onDeactivate(): void {}
  override handlePointerDown(ev: PointerEvent): void { /* place a stamp */ }
  override handlePointerMove(ev: PointerEvent): void {}
  override handlePointerUp(ev: PointerEvent): void {}
  override handleWheel(ev: WheelEvent): void {}
}

const tool = await editor.value?.registerTool('stamp', StampTool);
await editor.value?.changeActiveToolByName(tool!.name);
```
