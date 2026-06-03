---
sidebar_label: Custom Toolbar
displayed_sidebar: tutorialSidebar
title: "Custom Toolbar Example | Kritzel for Angular"
description: "Build a custom Kritzel toolbar by composing tools and controls for different use cases — from a minimal annotation setup to a fully programmatic external toolbar."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Custom Toolbar

This page shows how to compose the `controls` input on `<kritzel-editor>` into different toolbar configurations for real-world scenarios. Each example is self-contained and ready to copy into your project.

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

## Annotation-Only Toolbar

A minimal toolbar for document markup: just selection and a configured brush with a branded color palette. Users land directly in drawing mode and can pick from three pen sizes and three colors.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/custom-toolbar-annotation"
  repoFiles={['src/app/examples/custom-toolbar/custom-toolbar-annotation.component.ts']}
/>

The `config` object on the brush control sets starting defaults — `size`, `sizes`, and `palettes` — while the `type: 'config'` entry renders the settings panel so users can adjust them at runtime. Without the `config` entry the settings panel is never rendered, even though the tool still works. Colors are defined as `ThemeAwareColor` objects (`{ light, dark }`) so they adapt automatically when the user switches between light and dark mode.

---

## Diagramming Toolbar

A toolbar tailored for flowchart and diagram creation: selection, lines with arrowheads, shapes with sub-options (rectangle, ellipse, triangle), and text — no freehand brush needed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/custom-toolbar-diagramming"
  repoFiles={['src/app/examples/custom-toolbar/custom-toolbar-diagramming.component.ts']}
/>

The `arrows` config on the line tool controls arrowheads — `end.enabled: true` with `style: 'triangle'` adds a filled arrowhead to every new line. Available styles are `'triangle'`, `'open'`, `'diamond'`, and `'circle'`. Each `subOption` on the shape tool sets `toolProperty` to the property it controls; selecting a sub-option updates that property without switching away from the tool.

---

## Full Drawing App Toolbar

A production-ready toolbar with all available tools, separators grouping related items, shape sub-options, and individually configured color palettes — the kind of setup a general-purpose whiteboard or drawing application would ship.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/custom-toolbar-full-drawing-app"
  repoFiles={['src/app/examples/custom-toolbar/custom-toolbar-full-drawing-app.component.ts']}
/>

Separators (`type: 'separator'`) group related buttons visually. Each tool accepts a typed `config` object that lets you tailor colors, sizes, and behavior independently. The `config` control at the end renders the active tool's settings panel.

---

## Custom External Toolbar

Hide the built-in toolbar with `[isControlsVisible]="false"` and switch tools from your own custom UI via `setActiveTool()`. The `controls` array is still required — it registers tool instances and their configs with the engine even though the built-in toolbar is invisible.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/examples/custom-toolbar-external"
  repoFiles={['src/app/examples/custom-toolbar/custom-toolbar-external.component.ts']}
/>

`setActiveTool(name)` matches against the `name` field in the `controls` array. The `activeTool` signal keeps your custom button states in sync with what the engine is doing.
