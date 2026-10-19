---
sidebar_label: Tools
displayed_sidebar: tutorialSidebar
title: "Tools Concept | Kritzel for React"
description: "Understand the core concept of Tools in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Tools

## Overview

In Kritzel, the easiest way to manually interact with the canvas is through tools. Kritzel comes with a configurable toolbar that allows users to select and switch between a set of different prebuilt tools. A tool handles user interaction on the canvas and typically either adds or removes objects.

The toolbar includes the following tools:

- [Selection Tool](../api-reference/tools.md#selection-tool)
- [Brush Tool](../api-reference/tools.md#brush-tool)
- [Line Tool](../api-reference/tools.md#line-tool)
- [Shape Tool](../api-reference/tools.md#shape-tool)
- [Text Tool](../api-reference/tools.md#text-tool)
- [Image Tool](../api-reference/tools.md#image-tool)
- [Eraser Tool](../api-reference/tools.md#eraser-tool)

You can also customize existing tool configurations or register entirely new tools to extend editor capabilities.

If you would rather interact with the canvas programmatically, take a look at the [Objects](objects.md) section.

## Adjusting the Toolbar

You can adjust the toolbar by passing a custom `toolbarItems` array to `<KritzelEditor>`. The editor will register and render only the tools you provide. In this example, the toolbar items are limited to `selection`, `brush`, and `text`. Use `isDefault` to specify the default active tool.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/tools/toolbar"
  repoFiles={['src/pages/fundamentals/tools/ToolsToolbarPage.tsx']}
/>

## Adjusting the Tool Config

Each toolbar item of type `tool` accepts an optional `config` property for its initial values and the options shown in the configuration tooltip. Omitted properties use the tool's defaults.

- [Brush Config](../api-reference/tools.md#brush-tool)
- [Line Config](../api-reference/tools.md#line-tool)
- [Shape Config](../api-reference/tools.md#shape-tool)
- [Text Config](../api-reference/tools.md#text-tool)

Add a toolbar item of type `config` to let users adjust the active tool at runtime.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/tools/config"
  repoFiles={['src/pages/fundamentals/tools/ToolsConfigPage.tsx']}
/>

## Adding Custom Tools

To add a custom tool, include it as an item in the `toolbarItems` array. Kritzel registers the tool automatically and renders it in the toolbar. This example adds a highlighter built from `KritzelBrushTool` alongside `selection`, `brush`, and `text`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/tools/register"
  repoFiles={['src/pages/fundamentals/tools/ToolsRegisterPage.tsx']}
/>

## Switching the Active Tool

You can programmatically change the currently active tool by calling the `setActiveTool` method with the name of the tool on the editor instance.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/tools/change"
  repoFiles={['src/pages/fundamentals/tools/ToolsChangePage.tsx']}
/>

## Disabling Tools

To disable a specific tool, set `isDisabled` on the corresponding entry of the `toolbarItems` array. The tool is rendered in a disabled state and can no longer be selected, while every other tool remains fully interactive. `isDisabled` accepts a plain boolean or a function that returns either a boolean or a `Promise<boolean>`, so you can resolve it dynamically from your own state.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/fundamentals/tools/disable"
  repoFiles={['src/pages/fundamentals/tools/ToolsDisablePage.tsx']}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Tool Management](../api-reference/editor.md#tool-management)
- [Tools](../api-reference/tools.md)