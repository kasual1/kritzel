---
sidebar_label: Tools
displayed_sidebar: tutorialSidebar
title: "Tools Concept | Kritzel for Angular"
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
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/disable"
  repoFiles={['src/app/fundamentals/tools/tools-disable.component.ts']}
/>

## Customizing the Toolbar

If you want a focused editing experience, pass a custom `toolbarItems` array to `kritzel-editor`. The editor will register and render only the tools you provide. In this example, the toolbar items are limited to `select`, `brush`, and `text`. Use `isDefault` to specify the default active tool.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/toolbar"
  repoFiles={['src/app/fundamentals/tools/tools-toolbar.component.ts']}
/>

## Adding Custom Tools

You can register a custom tool configuration and then surface it in the toolbar panel. This example registers a custom highlighter built from `KritzelBrushTool` and adds it to the toolbar alongside `selection`, `pen`, and `text`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/register"
  repoFiles={['src/app/fundamentals/tools/tools-register.component.ts']}
/>

## Programmatically Changing the Active Tool

You can programmatically change the currently active tool using the API. This is useful when you want to build your own custom toolbar or trigger tool changes via keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/tools/change"
  repoFiles={['src/app/fundamentals/tools/tools-change.component.ts']}
/>

## Related API Methods

- Tool activation ([changeActiveTool](../api-reference/editor.md#changeactivetool))
- Tool configuration ([registerTool](../api-reference/editor.md#registertool))
- Tool interaction ([enable](../api-reference/editor.md#enable), [disable](../api-reference/editor.md#disable))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
