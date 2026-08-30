---
sidebar_label: Tools
displayed_sidebar: tutorialSidebar
title: "Tools Concept | Kritzel for Angular"
description: "Understand the core concept of Tools in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Tools

## Overview

In Kritzel, a tool determines how user input, such as mouse clicks and touches, behave on the canvas. Only one tool can be active at a time. The active tool handles all incoming pointer events and runs its specific logic to perform actions like drawing, selecting, or erasing.

Kritzel provides a versatile set of default tools like the Selection Tool, Brush Tool, Line Tool, Shape Tool, and Text Tool. You can also customize existing tools or register entirely new tools to extend functionality.

## Adjusting the Toolbar

You can adjust the toolbar by passing a custom `toolbarItems` array to `kritzel-editor`. The editor will register and render only the tools you provide. In this example, the toolbar items are limited to `select`, `brush`, and `text`. Use `isDefault` to specify the default active tool.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/toolbar"
  repoFiles={['src/app/fundamentals/tools/tools-toolbar.component.ts']}
/>


## Adjusting the Tool Config

Every toolbar item of type `tool` accepts an optional `config` property. It defines the initial state of the tool and the options that are offered in the config tooltip, such as the color palette, the available sizes, or the default opacity.

Each tool has its own config shape:

- **Brush** (`KritzelBrushToolConfig`) — `color`, `size`, `opacity`, `palette`, `sizes`
- **Line** (`KritzelLineToolConfig`) — `color`, `size`, `opacity`, `palette`, `sizes`, `arrows`
- **Shape** (`KritzelShapeToolConfig`) — `shapeType`, `fillColor`, `strokeColor`, `strokeWidth`, `fontColor`, `fontSize`, `fontFamily`, `palette`, `sizes`
- **Text** (`KritzelTextToolConfig`) — `color`, `size`, `fontFamily`, `availableFonts`, `palette`, `sizes`

Colors are theme aware, so each palette entry provides a value per theme and an optional `label`. All tool configs use a flat `palette` and `sizes` array. Any property you omit falls back to the corresponding default config.

The toolbar item of type `config` renders the config tooltip for the currently active tool, so keep it in the toolbar whenever you want users to change these values at runtime.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/config"
  repoFiles={['src/app/fundamentals/tools/tools-config.component.ts']}
/>

## Adding Custom Tools

You can register a custom tool configuration and then surface it in the toolbar panel. This example registers a custom highlighter built from `KritzelBrushTool` and adds it to the toolbar alongside `selection`, `pen`, and `text`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/register"
  repoFiles={['src/app/fundamentals/tools/tools-register.component.ts']}
/>

## Changing the Active Tool

You can programmatically change the currently active tool by calling the `changeActiveTool` method with the name of the tool on the editor instance.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/change"
  repoFiles={['src/app/fundamentals/tools/tools-change.component.ts']}
/>


## Disabling Tools

In order to disable a specific tool, set `isDisabled` on the corresponding entry of the `toolbarItems` array. The tool is rendered in a disabled state and can no longer be selected, while every other tool remains fully interactive. `isDisabled` accepts a plain boolean or a function that either returns a boolean or a `Promise<boolean>`, so you can resolve it dynamically from your own state.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/tool-disable"
  repoFiles={['src/app/fundamentals/tools/tools-disable.component.ts']}
/>

## Related API Methods

- Tool activation ([changeActiveTool](../api-reference/editor.md#changeactivetool))
- Tool configuration ([registerTool](../api-reference/editor.md#registertool))
- Tool interaction ([enable](../api-reference/editor.md#enable), [disable](../api-reference/editor.md#disable))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
