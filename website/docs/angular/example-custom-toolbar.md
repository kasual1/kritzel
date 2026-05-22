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
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-1"
  repoFiles={['src/app/examples/custom-toolbar-1.component.ts', 'src/app/examples/custom-toolbar-2.component.ts']}
/>

The toolbar now shows exactly two buttons. Any tool not listed is unavailable to the user.

---

## Step 2: Setting a Default Tool and Exposing Settings

Add `isDefault: true` to the brush so users land in drawing mode immediately. Then add a `type: 'config'` entry to expose the active tool's settings panel (color, size):

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-2"
  repoFiles={['src/app/examples/custom-toolbar-2.component.ts']}
/>

Without the `config` entry the settings panel is never rendered, even though the tools still work.

---

## Step 3: Configuring Initial Tool State

Use the `config` property on a tool control to set its defaults — the starting color, size,  available sizes, and available palette:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-3"
  repoFiles={['src/app/examples/custom-toolbar-3.component.ts']}
/>

Colors are defined as `ThemeAwareColor` objects (`{ light, dark }`) so they adapt automatically when the user switches between light and dark mode.

---

## Step 4: Adding More Tools

Expand the toolbar by adding eraser, line, shape, text, and image tools:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-4"
  repoFiles={['src/app/examples/custom-toolbar-4.component.ts']}
/>

---

## Step 5: Configuring Individual Tool Behaviors

Each tool accepts a typed `config` object that lets you tailor colors, sizes, and behavior to your application's needs. Add configurations for line, shape, and text:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-5"
  repoFiles={['src/app/examples/custom-toolbar-5.component.ts']}
/>

The `arrows` config controls arrowheads on lines. Setting `end.enabled: true` with `style: 'triangle'` adds a filled arrowhead to every new line. Available styles are `'triangle'`, `'open'`, `'diamond'`, and `'circle'`.

---

## Step 6: Adding Shape Sub-Options and Separators

`subOptions` lets a single toolbar button expose multiple variants — useful for the shape tool so users can switch between rectangle, ellipse, and triangle. Add separators to group related buttons visually:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-6"
  repoFiles={['src/app/examples/custom-toolbar-6.component.ts']}
/>

Each `subOption` sets `toolProperty` to the property on the tool instance it controls. Selecting a sub-option updates that property without switching away from the tool.

---

## Step 7: Driving the Active Tool Programmatically

Hide the built-in toolbar with `[isControlsVisible]="false"` and switch tools via `setActiveTool()` from your own UI. The `controls` array is still required — it registers tool instances and their configs with the engine:

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/custom-toolbar-7"
  repoFiles={['src/app/examples/custom-toolbar-7.component.ts']}
/>

`setActiveTool(name)` matches against the `name` field in the `controls` array. The `activeTool` signal keeps your custom button states in sync with what the engine is doing.
