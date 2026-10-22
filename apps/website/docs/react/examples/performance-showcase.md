---
sidebar_label: Performance Showcase
displayed_sidebar: tutorialSidebar
title: "Performance Showcase Example | Kritzel for React"
description: "Fill an infinite canvas with thousands of interactive GitHub Star buttons built as dynamic objects, and pan and zoom across them smoothly."
---

import LiveDemo from '@site/src/components/LiveDemo';

# Performance Showcase

This example fills a board with thousands of GitHub "Star" buttons. Every button is a real DOM element mounted as a dynamic object, so it can be selected, moved and resized like any other object, and clicking it opens the Kritzel repository. Kritzel only mounts the objects inside the viewport, so panning and zooming stay smooth even with 5,000 buttons on the board.

## Prerequisites

Complete the [Quick Start](../getting-started/quick-start.md) guide to have a working `<KritzelEditor>` rendered in your React app. This example builds on that setup.

---

## Featured Concepts

This example makes use of the following core concepts. Click on the links below to go into the details:

- [Dynamic Objects](/docs/react/advanced/dynamic-objects) — mounting custom HTML through a registered renderer
- [Objects](/docs/react/fundamentals/objects) — replacing the whole board with `removeObjects()` and `addObjects()`
- [Viewport](/docs/react/fundamentals/viewport) — panning and zooming across a large, crowded board

---

## Infinite Board of Star Buttons

The board starts with 1,000 buttons laid out on an evenly spaced grid around the center of the first screen, so the initial view is full of buttons at every count; larger counts only make the board bigger. Pan to explore it, or zoom out to see the whole crowd at once. Clicking a button selects it and opens GitHub in a new tab; a selected button can be dragged, resized or deleted like any other object. The control in the top-right corner rebuilds the board with 100, 1,000 or 5,000 buttons.

:::info Clicks versus drags
The button is a plain `div`, not a `<button>`, so the engine treats every press on it as a canvas interaction: selecting, moving and resizing keep working. The renderer opens the link itself, and only when the pointer moved less than a few pixels between `pointerdown` and `pointerup`, so dragging never opens GitHub.
:::

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/examples/performance-showcase"
  repoFiles={['src/pages/examples/PerformanceShowcasePage.tsx', 'src/pages/examples/github-star-button.ts']}
/>

### Registering the renderer

The page registers a renderer under a stable key in a `useEffect` hook and unregisters it in the effect cleanup. `onMount` builds the button inside the container the engine hands over, and `onUnmount` tears it down again. The engine calls `onUnmount` whenever a button leaves the viewport, so only the visible buttons exist in the DOM at any time.

```tsx
useEffect(() => {
  const buttons = mountedButtons.current;
  const destroy = (objectId: string, container: HTMLElement | null) => {
    buttons.get(objectId)?.destroy();
    buttons.delete(objectId);
    if (container) container.innerHTML = "";
  };
  KritzelDynamicObjectRendererRegistry.register(GITHUB_STAR_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) return;
      destroy(object.id, container);
      buttons.set(object.id, mountGithubStarButton(container, normalizeGithubStarButtonData(data)));
    },
    onSerialize: ({ object, data }) => buttons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data),
    onUnmount: ({ object, container, data }) => {
      const state = buttons.get(object.id)?.getData() ?? normalizeGithubStarButtonData(data);
      destroy(object.id, container);
      return state;
    },
  });
  return () => {
    buttons.forEach((instance) => instance.destroy());
    buttons.clear();
    KritzelDynamicObjectRendererRegistry.unregister(GITHUB_STAR_RENDERER_KEY);
  };
}, []);
```

`mountGithubStarButton()` styles every button through one shared stylesheet. The hover rules target the container's `:hover`, because the content of an unselected dynamic object has `pointer-events: none`. The engine captures the pointer on `pointerdown`, so the click check listens for `pointerup` on `window`.

### Creating the objects

The object factory places the buttons on a grid with a 10px gap on every side, centered on the world origin, which is the center of the initial viewport. The layout is computed from the count alone, so every load shows the same board. Each object carries only the renderer key and a label in `rendererData`.

```tsx
export function createGithubStarObject(x: number, y: number): KritzelDynamicObject {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Star";
  const object = new KritzelDynamicObject({
    element: placeholder,
    rendererKey: GITHUB_STAR_RENDERER_KEY,
    rendererData: { label: "Star" } satisfies GithubStarButtonData,
    translateX: x,
    translateY: y,
    width: STAR_WIDTH,
    height: STAR_HEIGHT,
  });
  object.isRotatable = false;
  return object;
}
```

The initial 1,000 buttons are passed in through the `workspaces` prop. Switching the count clears the selection, removes every object with `removeObjects()` and adds a freshly generated set with `addObjects()`.
