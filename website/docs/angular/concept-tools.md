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

## Managing the Active Tool

You can programmatically change the currently active tool using the API. This is useful when you want to build your own custom toolbar or trigger tool changes via keyboard shortcuts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/tools-change"
  repoFiles={['src/app/concepts/tools/tools-change.component.ts']}
/>

## Disabling and Enabling Tools

If your application needs to temporarily lock the canvas to prevent user interaction (for example, during a loading state or when opening a modal), you can disable and enable tool interactions.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/tools-disable"
  repoFiles={['src/app/concepts/tools/tools-disable.component.ts']}
/>

## Customizing and Registering Tools

You can register custom configurations for the built-in tools or even implement your own specialized tools by extending the base tool class. Once registered, these tools can be selected just like the default ones.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/tools-register"
  repoFiles={['src/app/concepts/tools/tools-register.component.ts']}
/>

## Related API Methods

- Tool activation (`changeActiveTool()`)
- Tool configuration (`registerTool()`)
- Tool interaction (`enable()`, `disable()`)

For a comprehensive view, see the [API Reference](api-reference-editor.md).
