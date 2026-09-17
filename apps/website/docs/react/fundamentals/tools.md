---
sidebar_label: Tools
displayed_sidebar: tutorialSidebar
title: "Tools Concept | Kritzel for React"
description: "Understand the core concept of Tools in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Tools

## Overview

In Kritzel, a Tool represents an active state that determines how user input (like mouse clicks, touches, and pen strokes) behaves on the canvas. Because Kritzel is a state machine, only one tool can be active at a time. The active tool intercepts all pointer events and executes its specific logic to perform actions such as drawing, selecting, or erasing.

Kritzel provides a versatile set of default tools like the Selection Tool, Brush Tool, Line Tool, Shape Tool, and Text Tool. You can also customize existing tools or register entirely custom tools to extend functionality.

## Disabling and Enabling Tools

If your application needs to temporarily lock the canvas to prevent user interaction (for example, during a loading state or when opening a modal), you can disable and enable tool interactions.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/tools/disable"
  repoFiles={['src/pages/fundamentals/tools/ToolsDisablePage.tsx']}
/>

## Customizing the Toolbar

If you want a focused editing experience, pass a custom `toolbarItems` array to `<KritzelEditor>`. The editor will register and render only the tools you provide. In this example, the toolbar items are limited to `select`, `brush`, and `text`. Use `isDefault` to specify the default active tool.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/tools/toolbar"
  repoFiles={['src/pages/fundamentals/tools/ToolsToolbarPage.tsx']}
/>

## Disabling Individual Toolbar Items

For more fine-grained control than the global `enable()`/`disable()` methods, set `isDisabled` on a specific entry of the `toolbarItems` array. The tool is rendered in a disabled state and can no longer be selected, while every other tool remains fully interactive. `isDisabled` accepts a plain boolean or a (sync or async) function, so you can resolve it dynamically from your own state or an API call.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/tools/toolbar-item-disable"
  repoFiles={['src/pages/fundamentals/tools/ToolsToolbarItemDisablePage.tsx']}
/>

## Adding Custom Tools

You can register a custom tool configuration and then surface it in the toolbar panel. This example registers a custom highlighter built from `KritzelBrushTool` and adds it to the toolbar alongside `selection`, `pen`, and `text`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/tools/register"
  repoFiles={['src/pages/fundamentals/tools/ToolsRegisterPage.tsx']}
/>

## Programmatically Changing the Active Tool

You can programmatically change the currently active tool using the API. This is useful when you want to build your own custom toolbar or trigger tool changes via keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/tools/change"
  repoFiles={['src/pages/fundamentals/tools/ToolsChangePage.tsx']}
/>

## Related API Methods

- Tool activation (`setActiveTool()`)
- Tool configuration (`registerTool()`)
- Tool interaction (`enable()`, `disable()`)

For a comprehensive view, see the [API Reference](../api-reference/editor.md).