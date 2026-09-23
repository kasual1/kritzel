---
sidebar_label: Dynamic Objects
displayed_sidebar: tutorialSidebar
title: "Dynamic Objects Concept | Kritzel for Vue"
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
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/dynamic-objects/html"
  repoFiles={['src/pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.vue']}
/>

## Rendering Framework Components

For richer content, use the `registerVueDynamicObjectRenderer` helper to register a renderer on `KritzelDynamicObjectRendererRegistry` with a stable `rendererKey`. A regular Vue SFC mounted directly into an engine-managed container may not carry its styles reliably, since style injection differs from a normal app mount — so the helper defines your component as a Vue custom element (`defineCustomElement`) and mounts that instead, keeping styles encapsulated.

State flows through `rendererData`:

- On mount, the helper initializes your component from `data` (falling back to `createInitialState()` on first mount) and passes it as the `initialState` prop.
- Your component reports state changes through an `onStateChange` prop; the helper tracks the latest value and returns it from `onUnmount`, so Kritzel persists it back onto the object for the next mount (including after a reload).

Always call the unregister function returned by `registerVueDynamicObjectRenderer` when the hosting page unmounts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/dynamic-objects/component"
  repoFiles={['src/pages/advanced/dynamic-objects/DynamicObjectsComponentPage.vue']}
/>

## Related API Methods and Types

- Object type ([`KritzelDynamicObject`](../fundamentals/objects.md))
- Renderer registry (`KritzelDynamicObjectRendererRegistry.register`, `KritzelDynamicObjectRendererRegistry.unregister`, `registerVueDynamicObjectRenderer`)
- Object creation ([addObject](../api-reference/editor.md#addobject))

For a comprehensive view, see the [API Reference](../api-reference/editor.md).
