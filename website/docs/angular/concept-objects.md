---
sidebar_label: Objects
displayed_sidebar: tutorialSidebar
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
