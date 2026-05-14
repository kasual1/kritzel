---

sidebar_label: Components
displayed_sidebar: tutorialSidebar
title: "Core Components | Kritzel for Angular"
description: "Understand the Kritzel editor and engine web components and how to use them in Angular."
---

# Core Components

Kritzel is built around two primary web components that serve different architectural needs depending on your application.

## The Editor

The `<kritzel-editor>` is the high-level, "batteries-included" component. When you drop this into your application, you immediately get a fully functioning collaborative whiteboard. 

### What it includes:
- The infinite canvas itself
- A default toolbar with all standard tools (Brush, Selection, Shapes, Text, etc.)
- A floating utility panel (Zoom controls, Undo/Redo)
- Right-click context menus for the canvas and specific objects
- Settings and export dialogs
- Workspace management

**When to use it:** Use the Editor when you want a complete whiteboard experience out-of-the-box and don't need to heavily customize the surrounding UI chrome.

### Configuration

You can configure the Editor's behavior and layout via properties. Common configurations include:
- **UI Toggles:** Show or hide built-in elements like the toolbar (`isControlsVisible`) or the utility panel (`isUtilityPanelVisible`).
- **Viewport Boundaries:** Restrict how far users can pan across the canvas (`viewportBoundaryLeft`, `viewportBoundaryRight`, etc.).
- **Zoom Limits:** Define the minimum and maximum permitted zoom levels (`scaleMin`, `scaleMax`).
- **Custom Toolbars:** Override the default built-in tools by passing a custom array of tools and config options to the `controls` property.

See the [Editor's API Reference](api-reference-editor.md) for a full list of props and methods.

## The Engine

The `<kritzel-engine>` is the low-level rendering and interaction primitive. It is completely "headless" concerning standard UI elements—it contains no toolbars, no floating panels, and no default menus.

### What it handles:
- Canvas rendering
- Viewport management (pan, zoom)
- Pointer event handling and tool interception
- Undo/redo stacks and Yjs synchronization

**When to use it:** Use the Engine when you are building a deeply custom application where Kritzel is just a piece of the puzzle. You can build your own HTML/CSS UI around it and drive the Engine entirely via its programmatic API.

### Configuration

Because the Engine is headless, configuring it typically revolves around core functionality rather than UI layout:
- **Viewport Boundaries & Zoom Limits:** Just like the Editor, you can restrain pan and zoom coordinates.
- **Context Menus:** Supply custom arrays for `globalContextMenuItems` and `objectContextMenuItems` to build your own right-click context menus.
- **Sync Providers:** Pass a `syncConfig` object to configure Yjs providers (e.g., WebSocket, IndexedDB) for real-time collaboration.
- **Theme:** Manually set the canvas rendering appearance by toggling the `theme` property between `'light'` and `'dark'`.

See the [Engine's API Reference](api-reference-engine.md) for a full list of props and methods.

