---
sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine Concept | Kritzel for React"
description: "Understand the Kritzel Engine component, a headless canvas primitive."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Engine

## Overview

`<KritzelEngine>` is a headless rendering primitive for deeply custom integrations. It renders no built-in UI chrome, so you build your own HTML/CSS UI around it and drive it entirely via its programmatic API. It shares its entire API surface (asynchronous methods returning Promises for managing state, viewports, tools, and objects) with its batteries-included sibling, the [Editor](../components/concept-editor.md).

## Driving the Engine from Custom UI

When you need a deeply custom application without built-in UI chrome, use `<KritzelEngine>`. The demo below shows how to bind external standard HTML buttons to the headless Engine.

Unlike the Editor, the Engine **does not register any drawing tools by default**. The Editor automatically registers tools through its built-in controls. When using the Engine directly, you must call `registerTool()` for each tool you want to use before calling `changeActiveTool()` or `changeActiveToolByName()`.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/fundamentals/components-engine"
  repoFiles={['src/pages/fundamentals/components/components-engine.tsx']}
/>

## Related API Methods

- Viewport and boundaries (`viewportBoundaryLeft`, `viewportBoundaryRight`, `scaleMin`, `scaleMax`)
- Theme management (`theme` prop)
- Context menu configuration (`globalContextMenuItems`, `objectContextMenuItems`)

For the full list of Engine-specific props, see the [Engine API Reference](../api-reference-engine.md).
