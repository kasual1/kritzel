---
sidebar_label: Dynamic Objects
displayed_sidebar: tutorialSidebar
title: "Dynamic Objects Concept | Kritzel for React"
description: "Understand how to embed native HTML or registered framework components as canvas objects in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Dynamic Objects

## Overview

Kritzel supports the integration of dynamic components in two different ways. You can choose how to embed the content based on what you are building:

- **Dynamic objects** can contain HTML or React components while remaining part of the canvas. They can be selected, moved, resized, and saved like other objects.
- **The iframe approach** hosts HTML, CSS, and JavaScript inside a scoped sandbox environment, keeping generated or user-authored content separate from the main application.

## Rendering HTML

The simplest way to use a dynamic object is to build a plain DOM subtree and pass it as `element`. Kritzel mounts it as-is; there is no renderer to register or unregister, and no lifecycle hooks to implement. This is a good fit for static content.

If the native HTML owns runtime behavior, such as event listeners or calculator state, use a registered renderer even when the content is plain DOM rather than a React component. Clipboard copy serializes the object while it is still mounted, so a renderer can return the latest serializable state from `onSerialize` and recreate fresh DOM listeners from `rendererData` after paste.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/html"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.tsx',
    'src/pages/advanced/dynamic-objects/html-calculator.tsx',
  ]}
/>

## Rendering Components

For richer content, register a renderer on `KritzelDynamicObjectRendererRegistry` with a stable `rendererKey`. When an object using that key mounts, the registry's `onMount` hook receives the object, its container, and any previously persisted `rendererData`, so you can create a React root with `createRoot` from `react-dom/client` and render a live component into the container instead of static markup.

State flows through `rendererData`:

- On mount, initialize your component from `data` (falling back to a default state on first mount).
- On serialize, `onSerialize` should return the component's latest state so copy/paste captures the live value.
- On unmount, `onUnmount` should return the component's latest state; Kritzel persists it back onto the object so the next mount (including after a reload) picks up where it left off.

Always unregister the renderer, and unmount any mounted React roots, when the hosting page unmounts.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/component"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsComponentPage.tsx',
    'src/pages/advanced/dynamic-objects/CalculatorWidget.tsx',
    'src/pages/advanced/dynamic-objects/html-calculator.tsx',
  ]}
/>

## Rendering iFrames

For user-authored or LLM-authored content, `KritzelIframeObject` provides a sandboxed space for HTML, CSS, and JavaScript. The iframe keeps its own content and interaction state while Kritzel manages it as a canvas object.

This example uses predefined prompts rather than a live LLM. Each prompt replaces the calculator shown in the iframe, with a loading view displayed during the change. Scripts run inside the iframe's sandbox rather than the main React application.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/advanced/dynamic-objects/iframe"
  repoFiles={[
    'src/pages/advanced/dynamic-objects/DynamicObjectsIframePage.tsx',
    'src/pages/advanced/dynamic-objects/iframe-calculator-definitions.tsx',
  ]}
/>

## API Details

For the full list of related APIs, see the following reference sections.

- [Dynamic Object](../api-reference/objects.md#dynamic-object)
- [Object](../api-reference/editor.md#object)
