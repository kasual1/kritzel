---
sidebar_label: Component Reference
title: "Component Reference | Kritzel for React"
description: "Reference for all built-in Kritzel web components available in React."
---
# Component Reference

## `<kritzel-editor>`

The high-level editor component. Wraps `<kritzel-engine>` and adds a toolbar, utility panel, context menus, settings dialog, export dialog, and workspace manager.

### Props

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `scaleMax` | `scale-max` | `number` | `ABSOLUTE_SCALE_MAX` | Maximum zoom scale allowed |
| `scaleMin` | `scale-min` | `number` | `ABSOLUTE_SCALE_MIN` | Minimum zoom scale allowed |
| `lockDrawingScale` | `lock-drawing-scale` | `boolean` | `true` | When true, objects are drawn at a fixed visual size regardless of zoom |
| `viewportBoundaryLeft` | `viewport-boundary-left` | `number` | `-Infinity` | Left boundary in world coordinates |
| `viewportBoundaryRight` | `viewport-boundary-right` | `number` | `Infinity` | Right boundary in world coordinates |
| `viewportBoundaryTop` | `viewport-boundary-top` | `number` | `-Infinity` | Top boundary in world coordinates |
| `viewportBoundaryBottom` | `viewport-boundary-bottom` | `number` | `Infinity` | Bottom boundary in world coordinates |
| `controls` | — | `KritzelToolbarControl[]` | Default toolbar | Toolbar items (selection, brush, line, eraser, text, shape, image, config) |
| `globalContextMenuItems` | — | `ContextMenuItem[]` | Paste, Select All | Context menu when right-clicking the canvas background |
| `objectContextMenuItems` | — | `ContextMenuItem[]` | Copy, Paste, Order, Align, Group, Delete | Context menu when right-clicking a selected object |
| `customSvgIcons` | — | `Record<string, string>` | `{}` | Custom SVG icon definitions by name |
| `isControlsVisible` | `is-controls-visible` | `boolean` | `true` | Show/hide the toolbar |
| `isUtilityPanelVisible` | `is-utility-panel-visible` | `boolean` | `true` | Show/hide the utility panel (undo/redo, zoom) |
| `syncConfig` | — | `KritzelSyncConfig` | `undefined` | Sync provider configuration |

### Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `isReady` | `HTMLElement` | Emitted when the editor is fully initialized |
| `objectsChange` | `KritzelBaseObject[]` | Emitted when objects are added, removed, or modified |
| `objectsAdded` | `ObjectsAddedEvent` | Emitted when objects are added |
| `objectsRemoved` | `ObjectsRemovedEvent` | Emitted when objects are removed |
| `objectsUpdated` | `ObjectsUpdatedEvent` | Emitted when objects are updated |
| `undoStateChange` | `KritzelUndoState` | Emitted when undo/redo availability changes |
| `themeChange` | `ThemeName` | Emitted when the theme changes |
| `viewportChange` | `KritzelViewportState` | Emitted on pan, zoom, or resize |

### Methods

The editor exposes the same methods as `<kritzel-engine>`. See the [API Reference](api-reference.md).

---

## `<kritzel-engine>`

The low-level canvas engine. Handles rendering, pointer events, viewport management, undo/redo, and workspace management. Does not include any UI chrome — use this when building a fully custom interface.

### Props

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `cursorTarget` | — | `HTMLElement` | `document.body` | Element to apply cursor styles to |
| `globalContextMenuItems` | — | `ContextMenuItem[]` | `undefined` | Context menu items for canvas background |
| `objectContextMenuItems` | — | `ContextMenuItem[]` | `undefined` | Context menu items for selected objects |
| `lockDrawingScale` | `lock-drawing-scale` | `boolean` | `true` | Fixed visual size for drawn objects regardless of zoom |
| `scaleMax` | `scale-max` | `number` | `ABSOLUTE_SCALE_MAX` | Maximum zoom scale |
| `scaleMin` | `scale-min` | `number` | `ABSOLUTE_SCALE_MIN` | Minimum zoom scale |
| `syncConfig` | — | `KritzelSyncConfig` | `undefined` | Sync provider configuration |
| `theme` | `theme` | `'light' \| 'dark'` | `'light'` | Active theme |
| `viewportBoundaryLeft` | `viewport-boundary-left` | `number` | `-Infinity` | Left pan boundary |
| `viewportBoundaryRight` | `viewport-boundary-right` | `number` | `Infinity` | Right pan boundary |
| `viewportBoundaryTop` | `viewport-boundary-top` | `number` | `-Infinity` | Top pan boundary |
| `viewportBoundaryBottom` | `viewport-boundary-bottom` | `number` | `Infinity` | Bottom pan boundary |
| `workspace` | — | `KritzelWorkspace` | `undefined` | The active workspace |

### Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `isEngineReady` | `KritzelEngineState` | Emitted when the engine is fully initialized |
| `activeToolChange` | `KritzelBaseTool` | Emitted when the active tool changes |
| `longpress` | `PointerEvent` | Emitted on long-press (useful for mobile context menus) |
| `objectsChange` | `KritzelBaseObject[]` | Emitted when objects are added, removed, or modified |
| `objectsAdded` | `ObjectsAddedEvent` | Emitted when objects are added |
| `objectsRemoved` | `ObjectsRemovedEvent` | Emitted when objects are removed |
| `objectsUpdated` | `ObjectsUpdatedEvent` | Emitted when objects are updated |
| `objectsInViewportChange` | `KritzelBaseObject[]` | Emitted when visible objects change (after pan/zoom) |
| `objectsSelectionChange` | `void` | Emitted when selected objects change |
| `undoStateChange` | `KritzelUndoState` | Emitted when undo/redo availability changes |
| `viewportChange` | `KritzelViewportState` | Emitted on pan, zoom, or resize |
| `workspacesChange` | `KritzelWorkspace[]` | Emitted when workspaces are created, updated, or deleted |

### Methods

See the [API Reference](api-reference.md).
