---
sidebar_label: Dynamic Objects
displayed_sidebar: tutorialSidebar
title: "Dynamic Objects Concept | Kritzel for Angular"
description: "Understand how to embed native HTML or registered framework components as canvas objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Dynamic Objects

## Overview

Most canvas objects in Kritzel (shapes, lines, text, images) render through the engine's own drawing pipeline. `KritzelDynamicObject` is different: it is a canvas object whose visual content is arbitrary HTML that you provide, while it still fully participates in selection, movement, resizing, ordering, and workspace persistence like any other object.

`KritzelDynamicObject` supports two hosting modes:

- **Native HTML mode** — pass a plain DOM `element` and let the object mount it directly. No registration is required.
- **Registered component mode** — pass a `rendererKey` (and optional `rendererData`) so a renderer registered on `KritzelDynamicObjectRendererRegistry` mounts a real Angular, React, or Vue component into the object's container.

```ts
interface KritzelDynamicObjectConfig {
  element?: HTMLElement;
  rendererKey?: string;
  rendererData?: unknown;
  translateX?: number;
  translateY?: number;
  width?: number;
  height?: number;
}
```

Both modes produce the same kind of object on the canvas — the difference is purely in how the content inside it is mounted and, for registered components, how its state survives mount/unmount cycles.

## Rendering Native HTML

The simplest way to use a dynamic object is to build a plain DOM subtree and pass it as `element`. Kritzel mounts it as-is; there is no renderer to register or unregister, and no lifecycle hooks to implement. This is a good fit for static or lightly interactive content that does not need a full component framework.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/dynamic-objects/html"
  repoFiles={['src/app/advanced/dynamic-objects/dynamic-objects-html.component.ts']}
/>

## Rendering Framework Components

For richer content, register a renderer on `KritzelDynamicObjectRendererRegistry` with a stable `rendererKey`. When an object using that key mounts, the registry's `onMount` hook receives the object, its container, and any previously persisted `rendererData`, so you can create and attach a live Angular component (via `createComponent`, `ApplicationRef`, and `EnvironmentInjector`) instead of static markup.

State flows through `rendererData`:

- On mount, initialize your component from `data` (falling back to a default state on first mount).
- On unmount, `onUnmount` should return the component's latest state; Kritzel persists it back onto the object so the next mount (including after a reload) picks up where it left off.

Always unregister the renderer, and detach/destroy any mounted component views, when the hosting page is destroyed.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/dynamic-objects/component"
  repoFiles={['src/app/advanced/dynamic-objects/dynamic-objects-component.component.ts']}
/>

## Related API Methods and Types

- Object type ([`KritzelDynamicObject`](../api-reference/object-types.md#kritzelcustomelement))
- Renderer registry (`KritzelDynamicObjectRendererRegistry.register`, `KritzelDynamicObjectRendererRegistry.unregister`)
- Object creation ([addObject](../api-reference/editor.md#addobject))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
