---
sidebar_label: Dynamic Objects
displayed_sidebar: tutorialSidebar
title: "Dynamic Objects Concept | Kritzel for Vue"
description: "Understand how to embed native HTML or registered framework components as canvas objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Dynamic Objects

## Overview

Kritzel supports the integration of dynamic components in two different ways. You can choose how to embed the content based on what you are building:

- **Dynamic objects** can contain HTML or framework-specific components while remaining part of the canvas. They can be selected, moved, resized, and saved like other objects.
- **The iframe approach** hosts HTML, CSS, and JavaScript inside a scoped sandbox environment, keeping generated or user-authored content separate from the main application.

## Rendering HTML

The simplest way to use a dynamic object is to build a plain DOM subtree and pass it as `element`. Kritzel mounts it as-is; there is no renderer to register or unregister, and no lifecycle hooks to implement. This is a good fit for static content.

If the native HTML owns runtime behavior, such as event listeners or local calculator state, use a registered renderer even when the content is plain DOM rather than a Vue component. Clipboard copy serializes the object while it is still mounted, so a renderer can return the latest serializable state from `onSerialize` and recreate fresh DOM listeners from `rendererData` after paste.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/dynamic-objects/html"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.vue',
  ]}
/>

## Rendering Components

For richer content, use the `registerVueDynamicObjectRenderer` helper to register a renderer on `KritzelDynamicObjectRendererRegistry` with a stable `rendererKey`. A regular Vue SFC mounted directly into an engine-managed container may not carry its styles reliably, since style injection differs from a normal app mount — so the helper defines your component as a Vue custom element (`defineCustomElement`) and mounts that instead, keeping styles encapsulated.

The helper defines the `.ce.vue` component as a custom element so styles remain encapsulated when the engine mounts it outside the normal Vue component tree. State flows through `rendererData`:

- On mount, the helper initializes your component from `data` (falling back to `createInitialState()` on first mount) and passes it as the `initialState` prop.
- The component reports state changes through an `onStateChange` prop. The demo updates the object's `rendererData` immediately for copy/export and the helper returns its latest state from `onUnmount`, so remounts and reloads resume from the same value.

Always call the unregister function returned by `registerVueDynamicObjectRenderer` when the hosting page unmounts.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/dynamic-objects/component"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsComponentPage.vue',
    'src/pages/advanced/dynamic-objects/CalculatorWidget.ce.vue',
  ]}
/>

Dynamic object content follows Kritzel's wheel handoff rules: scrollable embedded content consumes wheel input while it can scroll; at a boundary, the wheel is passed back to the canvas viewport.

## Rendering iFrames

For user-authored or LLM-authored content, `KritzelIframeObject` provides a sandboxed space for HTML, CSS, and JavaScript. The iframe keeps its own content and interaction state while Kritzel manages it as a canvas object.

This example uses predefined prompts rather than a live LLM. Each prompt replaces the calculator shown in the iframe, with a loading view displayed during the change.

<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/vue"
  demoPath="/advanced/dynamic-objects/iframe"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsIframePage.vue',
  ]}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Dynamic Object](../api-reference/objects.md#dynamic-object)
- [Object](../api-reference/editor.md#object)
