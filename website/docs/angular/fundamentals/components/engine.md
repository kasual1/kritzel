---
sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine Concept | Kritzel for Angular"
description: "Understand the Kritzel Engine component, a headless canvas primitive."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Engine

## Overview

The `<kritzel-engine>` is a headless rendering primitive for deeply custom integrations. It renders no built-in UI chrome, so you build your own HTML/CSS UI around it and drive it entirely via its programmatic API. It shares its entire API surface (asynchronous methods returning Promises for managing state, viewports, tools, and objects) with its "batteries-included" sibling, the [Editor](./editor.md).

## Driving the Engine from Custom UI

When you need a deeply custom application without built-in UI chrome, use the `<kritzel-engine>`. The demo below demonstrates how to bind external standard HTML buttons to the headless Engine.

Unlike the Editor, the Engine **does not register any drawing tools by default**. The Editor automatically registers tools through its built-in `<kritzel-toolbar>` toolbar component. When using the Engine directly, you must call `registerTool()` for each tool you want to use before calling `changeActiveTool()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/fundamentals/components/engine"
  repoFiles={['src/app/fundamentals/components/components-engine.component.ts']}
/>

## Related API Methods

- Tool registration and selection ([registerTool](../../api-reference/editor.md#registertool), [changeActiveTool](../../api-reference/editor.md#changeactivetool))
- Viewport and boundaries ([viewportBoundaryLeft](../../api-reference/editor.md#props), [viewportBoundaryRight](../../api-reference/editor.md#props), [scaleMin](../../api-reference/editor.md#props), [scaleMax](../../api-reference/editor.md#props))
- Theme management ([theme](../../api-reference/editor.md#props) property)
- Context menu configuration ([globalContextMenuItems](../../api-reference/editor.md#props), [objectContextMenuItems](../../api-reference/editor.md#props))

For the full list of Engine-specific props, see the [Engine API Reference](../../api-reference/engine.md).
