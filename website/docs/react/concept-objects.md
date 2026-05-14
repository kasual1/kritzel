---

sidebar_label: Objects
displayed_sidebar: tutorialSidebar
title: "Canvas Objects | Kritzel for React"
description: "Brush strokes, shapes, text, lines, and images: the building blocks rendered on the Kritzel canvas."
---

# Canvas Objects

Everything visually rendered onto the Kritzel canvas—whether it's a brush stroke, a text block, or an image—is conceptually an **Object**. 

## Object Properties

All objects share a common foundational structure. No matter the specific type, every object tracks its spatial existence in the infinite canvas using standard 2D properties:
- **Position & Dimensions:** `x`, `y`, `width`, `height`
- **Transforms:** `rotation`, `scale`
- **Styling:** `opacity`, `backgroundColor`, `borderColor`, `zIndex`

Because all objects share this base, the engine can uniformly handle hit-testing (detecting if a user clicked an object), rendering bounds, and selection outlines.

## Object Types

Currently, tools create specific instances of sub-classed objects:
- `KritzelPath`: Stores coordinate arrays representing fluid hand-drawn strokes.
- `KritzelLine` & `KritzelShape`: Stores geometric configurations and snap anchors.
- `KritzelText`: Stores rich-text document state (via ProseMirror).
- `KritzelImage`: Stores blob or URL references for raster rendering.
- `KritzelCustomElement`: A powerful container that lets you embed native DOM nodes inside the canvas coordinate system!

## Reactivity & Sync

Objects in Kritzel are highly reactive. When an object's properties change (e.g., when it is dragged across the screen), the engine automatically schedules a re-render. 

Furthermore, if a Workspace is connected to a Sync Provider, the object's properties are deeply backed by a [Yjs](https://docs.yjs.dev/) CRDT structure. This means the object isn't just local state—it's synchronized instantly with all other connected clients, resolving conflicts automatically.
