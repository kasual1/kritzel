---

sidebar_label: Custom Toolbar
displayed_sidebar: tutorialSidebar
title: "Custom Toolbar Example | Kritzel for Angular"
description: "Build a custom Kritzel toolbar by composing tools and controls."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Toolbar

This guide builds up a custom toolbar step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup.

## Prerequisites

Complete the [Quick Start](./quick-start.md) guide to have a working `<kritzel-editor>` rendered in your application. This example builds on that setup.

---

## How the Toolbar Works

The toolbar is controlled by the `controls` input on `<kritzel-editor>`. It accepts an array of `KritzelToolbarControl` objects, where each entry describes one item in the toolbar.

```ts
interface KritzelToolbarControl {
  type: 'tool' | 'config' | 'separator';
  name: string;
  tool?: typeof KritzelBaseTool;  // the tool class to activate on click
  icon?: string;                  // built-in icon name
  isDefault?: boolean;            // make this the initially active tool
  config?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig | KritzelTextToolConfig;
  subOptions?: KritzelToolbarSubOption[];  // for multi-variant tools (e.g., shapes)
}
```

There are three control types:
- **`'tool'`** — a clickable button that activates a drawing tool
- **`'config'`** — inserts the active tool's settings panel (color picker, size slider, etc.)
- **`'separator'`** — inserts a visual divider between groups of buttons

---

## Step 1: Selecting Only Specific Tools

Pass a `controls` array to replace the default set. Start with just selection and brush:

<LiveDemo
  stackBlitzUrl="https://stackblitz.com/github/kritzelapp/examples/tree/main/custom-toolbar/0/angular"
  iframeUrl="https://kritzelapp.github.io/examples/custom-toolbar/0/angular/"
  repoFiles={['src/app/app.ts', 'src/app/app.spec.ts']}
/>

The toolbar now shows exactly two buttons. Any tool not listed is unavailable to the user.

---

## Step 2: Setting a Default Tool and Exposing Settings

Add `isDefault: true` to the brush so users land in drawing mode immediately. Then add a `type: 'config'` entry to expose the active tool's settings panel (color, size):

<LiveDemo
  stackBlitzUrl="https://stackblitz.com/github/kritzelapp/examples/tree/main/custom-toolbar/1/angular"
  iframeUrl="https://kritzelapp.github.io/examples/custom-toolbar/1/angular/"
  repoFiles={['src/app/app.ts']}
/>

Without the `config` entry the settings panel is never rendered, even though the tools still work.

---

## Step 3: Configuring Initial Tool State

Use the `config` property on a tool control to set its defaults — the starting color, size, and available palette:

```ts
controls: KritzelToolbarControl[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    isDefault: true,
    // highlight-start
    config: {
      type: 'pen',
      color: { light: '#000000', dark: '#ffffff' },
      size: 8,
      palettes: {
        pen: [
          { light: '#000000', dark: '#ffffff', label: 'Black' },
          { light: '#e53935', dark: '#e53935', label: 'Red' },
          { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
        ],
      },
    },
    // highlight-end
  },
  {
    name: 'config',
    type: 'config',
  },
];
```

Colors are defined as `ThemeAwareColor` objects (`{ light, dark }`) so they adapt automatically when the user switches between light and dark mode.

---

## Step 4: Adding More Tools

Expand the toolbar by adding eraser, line, shape, text, and image tools:

```ts
import {
  KritzelEditor,
  KritzelToolbarControl,
  KritzelSelectionTool,
  KritzelBrushTool,
  KritzelEraserTool,   // highlight-line
  KritzelLineTool,     // highlight-line
  KritzelShapeTool,    // highlight-line
  KritzelTextTool,     // highlight-line
  KritzelImageTool,    // highlight-line
} from 'kritzel-angular';

controls: KritzelToolbarControl[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
    isDefault: true,
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      type: 'pen',
      color: { light: '#000000', dark: '#ffffff' },
      size: 8,
      palettes: {
        pen: [
          { light: '#000000', dark: '#ffffff', label: 'Black' },
          { light: '#e53935', dark: '#e53935', label: 'Red' },
          { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
        ],
      },
    },
  },
  // highlight-start
  {
    name: 'eraser',
    type: 'tool',
    tool: KritzelEraserTool,
    icon: 'eraser',
  },
  {
    name: 'line',
    type: 'tool',
    tool: KritzelLineTool,
    icon: 'arrow',
  },
  {
    name: 'shape',
    type: 'tool',
    tool: KritzelShapeTool,
    icon: 'shape-rectangle',
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
  },
  {
    name: 'image',
    type: 'tool',
    tool: KritzelImageTool,
    icon: 'image',
  },
  // highlight-end
  {
    name: 'config',
    type: 'config',
  },
];
```

---

## Step 5: Configuring Individual Tool Behaviors

Each tool accepts a typed `config` object. Add configurations for line, shape, and text:

```ts
import { ShapeType } from 'kritzel-angular'; // highlight-line

controls: KritzelToolbarControl[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
    isDefault: true,
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      type: 'pen',
      color: { light: '#000000', dark: '#ffffff' },
      size: 8,
      palettes: {
        pen: [
          { light: '#000000', dark: '#ffffff', label: 'Black' },
          { light: '#e53935', dark: '#e53935', label: 'Red' },
          { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
        ],
      },
    },
  },
  {
    name: 'eraser',
    type: 'tool',
    tool: KritzelEraserTool,
    icon: 'eraser',
  },
  {
    name: 'line',
    type: 'tool',
    tool: KritzelLineTool,
    icon: 'arrow',
    // highlight-start
    config: {
      color: { light: '#000000', dark: '#ffffff' },
      size: 3,
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
      arrows: {
        end: { enabled: true, style: 'triangle' },
      },
    },
    // highlight-end
  },
  {
    name: 'shape',
    type: 'tool',
    tool: KritzelShapeTool,
    icon: 'shape-rectangle',
    // highlight-start
    config: {
      shapeType: ShapeType.Rectangle,
      fillColor: { light: 'transparent', dark: 'transparent' },
      strokeColor: { light: '#000000', dark: '#ffffff' },
      strokeWidth: 3,
      fontColor: { light: '#000000', dark: '#ffffff' },
      fontSize: 14,
      fontFamily: 'Arial',
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
    },
    // highlight-end
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    // highlight-start
    config: {
      color: { light: '#000000', dark: '#ffffff' },
      size: 16,
      fontFamily: 'Arial',
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
    },
    // highlight-end
  },
  {
    name: 'image',
    type: 'tool',
    tool: KritzelImageTool,
    icon: 'image',
  },
  {
    name: 'config',
    type: 'config',
  },
];
```

The `arrows` config controls arrowheads on lines. Setting `end.enabled: true` with `style: 'triangle'` adds a filled arrowhead to every new line. Available styles are `'triangle'`, `'open'`, `'diamond'`, and `'circle'`.

---

## Step 6: Adding Shape Sub-Options and Separators

`subOptions` lets a single toolbar button expose multiple variants — useful for the shape tool so users can switch between rectangle, ellipse, and triangle. Add separators to group related buttons visually:

```ts
controls: KritzelToolbarControl[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
    isDefault: true,
  },
  // highlight-start
  {
    name: 'separator-draw',
    type: 'separator',
  },
  // highlight-end
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      type: 'pen',
      color: { light: '#000000', dark: '#ffffff' },
      size: 8,
      palettes: {
        pen: [
          { light: '#000000', dark: '#ffffff', label: 'Black' },
          { light: '#e53935', dark: '#e53935', label: 'Red' },
          { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
        ],
      },
    },
  },
  {
    name: 'eraser',
    type: 'tool',
    tool: KritzelEraserTool,
    icon: 'eraser',
  },
  {
    name: 'line',
    type: 'tool',
    tool: KritzelLineTool,
    icon: 'arrow',
    config: {
      color: { light: '#000000', dark: '#ffffff' },
      size: 3,
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
      arrows: {
        end: { enabled: true, style: 'triangle' },
      },
    },
  },
  {
    name: 'shape',
    type: 'tool',
    tool: KritzelShapeTool,
    icon: 'shape-rectangle',
    config: {
      shapeType: ShapeType.Rectangle,
      fillColor: { light: 'transparent', dark: 'transparent' },
      strokeColor: { light: '#000000', dark: '#ffffff' },
      strokeWidth: 3,
      fontColor: { light: '#000000', dark: '#ffffff' },
      fontSize: 14,
      fontFamily: 'Arial',
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
    },
    // highlight-start
    subOptions: [
      {
        id: 'rectangle',
        icon: 'shape-rectangle',
        label: 'Rectangle',
        value: ShapeType.Rectangle,
        toolProperty: 'shapeType',
      },
      {
        id: 'ellipse',
        icon: 'shape-ellipse',
        label: 'Ellipse',
        value: ShapeType.Ellipse,
        toolProperty: 'shapeType',
      },
      {
        id: 'triangle',
        icon: 'shape-triangle',
        label: 'Triangle',
        value: ShapeType.Triangle,
        toolProperty: 'shapeType',
      },
    ],
    // highlight-end
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    config: {
      color: { light: '#000000', dark: '#ffffff' },
      size: 16,
      fontFamily: 'Arial',
      palette: [
        { light: '#000000', dark: '#ffffff' },
        { light: '#e53935', dark: '#e53935' },
        { light: '#1a73e8', dark: '#1a73e8' },
      ],
    },
  },
  {
    name: 'image',
    type: 'tool',
    tool: KritzelImageTool,
    icon: 'image',
  },
  // highlight-start
  {
    name: 'separator-config',
    type: 'separator',
  },
  // highlight-end
  {
    name: 'config',
    type: 'config',
  },
];
```

Each `subOption` sets `toolProperty` to the property on the tool instance it controls. Selecting a sub-option updates that property without switching away from the tool.

---

## Step 7: Driving the Active Tool Programmatically

Hide the built-in toolbar with `[isControlsVisible]="false"` and switch tools via `setActiveTool()` from your own UI. The `controls` array is still required — it registers tool instances and their configs with the engine:

```ts title="editor.component.ts"
import { Component, ViewChild, signal } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import {
  KritzelEditor,
  KritzelToolbarControl,
  KritzelSelectionTool,
  KritzelBrushTool,
  KritzelEraserTool,
  KritzelLineTool,
  KritzelShapeTool,
  KritzelTextTool,
  KritzelImageTool,
  ShapeType,
} from 'kritzel-angular';

type ToolName = 'selection' | 'brush' | 'eraser' | 'line' | 'shape' | 'text' | 'image';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      @for (tool of tools; track tool.name) {
        <button
          [class.active]="activeTool() === tool.name"
          (click)="setTool(tool.name)"
        >
          {{ tool.label }}
        </button>
      }
    </div>

    <kritzel-editor
      #editor
      [controls]="controls"
      [isControlsVisible]="false"
    ></kritzel-editor>
  `,
})
export class EditorComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  activeTool = signal<ToolName>('selection');

  tools: { name: ToolName; label: string }[] = [
    { name: 'selection', label: 'Select' },
    { name: 'brush', label: 'Brush' },
    { name: 'eraser', label: 'Eraser' },
    { name: 'line', label: 'Line' },
    { name: 'shape', label: 'Shape' },
    { name: 'text', label: 'Text' },
    { name: 'image', label: 'Image' },
  ];

  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
      isDefault: true,
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: {
        type: 'pen',
        color: { light: '#000000', dark: '#ffffff' },
        size: 8,
        palettes: {
          pen: [
            { light: '#000000', dark: '#ffffff', label: 'Black' },
            { light: '#e53935', dark: '#e53935', label: 'Red' },
            { light: '#1a73e8', dark: '#1a73e8', label: 'Blue' },
          ],
        },
      },
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
    },
    {
      name: 'line',
      type: 'tool',
      tool: KritzelLineTool,
      icon: 'arrow',
      config: {
        color: { light: '#000000', dark: '#ffffff' },
        size: 3,
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
        ],
        arrows: {
          end: { enabled: true, style: 'triangle' },
        },
      },
    },
    {
      name: 'shape',
      type: 'tool',
      tool: KritzelShapeTool,
      icon: 'shape-rectangle',
      config: {
        shapeType: ShapeType.Rectangle,
        fillColor: { light: 'transparent', dark: 'transparent' },
        strokeColor: { light: '#000000', dark: '#ffffff' },
        strokeWidth: 3,
        fontColor: { light: '#000000', dark: '#ffffff' },
        fontSize: 14,
        fontFamily: 'Arial',
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
        ],
      },
      subOptions: [
        {
          id: 'rectangle',
          icon: 'shape-rectangle',
          label: 'Rectangle',
          value: ShapeType.Rectangle,
          toolProperty: 'shapeType',
        },
        {
          id: 'ellipse',
          icon: 'shape-ellipse',
          label: 'Ellipse',
          value: ShapeType.Ellipse,
          toolProperty: 'shapeType',
        },
        {
          id: 'triangle',
          icon: 'shape-triangle',
          label: 'Triangle',
          value: ShapeType.Triangle,
          toolProperty: 'shapeType',
        },
      ],
    },
    {
      name: 'text',
      type: 'tool',
      tool: KritzelTextTool,
      icon: 'type',
      config: {
        color: { light: '#000000', dark: '#ffffff' },
        size: 16,
        fontFamily: 'Arial',
        palette: [
          { light: '#000000', dark: '#ffffff' },
          { light: '#e53935', dark: '#e53935' },
          { light: '#1a73e8', dark: '#1a73e8' },
        ],
      },
    },
    {
      name: 'image',
      type: 'tool',
      tool: KritzelImageTool,
      icon: 'image',
    },
  ];

  async setTool(name: ToolName) {
    this.activeTool.set(name);
    await this.editor.setActiveTool(name);
  }
}
```

`setActiveTool(name)` matches against the `name` field in the `controls` array. The `activeTool` signal keeps your custom button states in sync with what the engine is doing.
