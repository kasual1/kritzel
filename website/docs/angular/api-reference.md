---
sidebar_label: API Reference
title: "API Reference | Kritzel for Angular"
description: "Top-level API reference for Kritzel components, props, events, and methods in Angular."
toc_max_heading_level: 2
---
# API Reference

This page groups API surface by domain category. Each category contains related props, events, and methods.

Component-specific details still live in:

- [Editor API Reference](./api-reference-editor)
- [Engine API Reference](./api-reference-engine)

Notes:

- `Component` indicates where the prop or event is available (`Editor`, `Engine`, or `Both`).
- Methods listed here are shared between `<kritzel-editor>` and `<kritzel-engine>`.
- All methods are async and return `Promise` values.

## Object

### Props

No object-specific props.

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| objectsAdded | Both | ObjectsAddedEvent | Emitted when one or more objects are added to the canvas. |
| objectsChange | Both | KritzelBaseObject[] | Emitted when objects are added, removed, or modified. |
| objectsRemoved | Both | ObjectsRemovedEvent | Emitted when one or more objects are removed from the canvas. |
| objectsUpdated | Both | ObjectsUpdatedEvent | Emitted when one or more objects are updated on the canvas. |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### updateObject

Updates properties of an existing canvas object.

```ts
updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null>
```

#### getObjectById

Retrieves a canvas object by its unique ID.

```ts
getObjectById<T extends KritzelBaseObject>(id: string): Promise<T | null>
```

#### getAllObjects

Returns all objects on the canvas across all layers.

```ts
getAllObjects<T extends KritzelBaseObject>: Promise<T[]>
```

#### findObjects

Returns all objects matching the given predicate. Excludes internal selection-related objects.

```ts
findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject) => boolean): Promise<T[]>
```

#### getObjectsTotalCount

Returns the total number of objects on the canvas.

```ts
getObjectsTotalCount: Promise<number>
```

#### getObjectsInViewport

Returns all objects currently visible within the viewport bounds.

```ts
getObjectsInViewport: Promise<KritzelBaseObject[]>
```

---

## Selection

### Props

No selection-specific props.

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| objectsSelectionChange | Both | void | Emitted when the set of selected objects changes. |

### Methods

#### getSelectedObjects

Returns the currently selected objects. Returns an empty array if nothing is selected.

```ts
getSelectedObjects: Promise<KritzelBaseObject[]>
```

#### selectObjects

Programmatically selects the given objects. Switches to the selection tool automatically.

```ts
selectObjects(objects: KritzelBaseObject[]): Promise<void>
```

#### selectAllObjectsInViewport

Selects all objects currently visible in the viewport. Switches to the selection tool automatically.

```ts
selectAllObjectsInViewport: Promise<void>
```

#### clearSelection

Deselects all currently selected objects.

```ts
clearSelection: Promise<void>
```

#### triggerSelectionChange

Manually triggers the `objectsSelectionChange` event.

```ts
triggerSelectionChange: Promise<void>
```

---

## Viewport & Navigation

### Props

| Property | Component | Type | Description |
|----------|-----------|------|-------------|
| isPanningEnabled | Both | boolean | Enable or disable viewport panning via regular wheel input. |
| isZoomingEnabled | Both | boolean | Enable or disable viewport zooming via Ctrl+wheel. |
| scaleMax | Both | number | Maximum zoom scale allowed. |
| scaleMin | Both | number | Minimum zoom scale allowed. |
| viewportBoundaryTop | Both | number | Top pan boundary in world coordinates. |
| viewportBoundaryRight | Both | number | Right pan boundary in world coordinates. |
| viewportBoundaryBottom | Both | number | Bottom pan boundary in world coordinates. |
| viewportBoundaryLeft | Both | number | Left pan boundary in world coordinates. |

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| viewportChange | Both | KritzelViewportState | Emitted on viewport pan, zoom, or resize. |
| objectsInViewportChange | Engine | ObjectsInViewportChangeEvent | Emitted when visible objects change after pan/zoom. |

### Methods

#### getViewport

Returns the current viewport state including position, scale, and dimensions.

```ts
getViewport: Promise<KritzelViewportState>
```

#### setViewport

Sets the viewport to center on the given world coordinates at the specified scale.

```ts
setViewport(x: number, y: number, scale: number): Promise<void>
```

#### panTo

Pans the viewport to center on the given world coordinates without changing the scale.

```ts
panTo(x: number, y: number): Promise<void>
```

#### zoomTo

Zooms the viewport to the given scale. Optionally centers on a world point; if omitted, zooms around the viewport center.

```ts
zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>
```

#### centerObjectInViewport

Pans and zooms the viewport to center on the given object.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject>
```

#### backToContent

Pans and zooms the viewport to fit the nearest content, with padding. Useful when the user has panned away from all objects.

```ts
backToContent: Promise<boolean>
```

Returns `true` if content was found and the viewport was adjusted, `false` otherwise.

#### screenToWorld

Converts screen-relative pixel coordinates to world coordinates.

```ts
screenToWorld(x: number, y: number): Promise<{ x: number; y: number }>
```

#### worldToScreen

Converts world coordinates to screen-relative pixel coordinates.

```ts
worldToScreen(x: number, y: number): Promise<{ x: number; y: number }>
```

---

## Workspace

### Props

| Property | Component | Type | Description |
|----------|-----------|------|-------------|
| workspace | Engine | KritzelWorkspace | Active workspace to load and display. |
| activeWorkspaceId | Both | string | Optional workspace ID to load or activate. |
| syncConfig | Both | KritzelSyncConfig | Real-time collaboration sync provider configuration. |
| user | Both | IKritzelUser | Current user used for awareness broadcasting. |
| activeUsers | Editor | IKritzelUser[] | Other active users in the current collaboration session. |
| isLoading | Both | boolean | External loading state. Combined with internal workspace loading state. |

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| activeWorkspaceChange | Both | KritzelWorkspace | Emitted when the active workspace changes. |
| workspacesChange | Both | KritzelWorkspace[] | Emitted when workspaces are created, updated, or deleted. |
| awarenessChange | Both | AwarenessStateMap | Emitted when collaborative awareness states change. |
| syncingChange | Engine | boolean | Emitted when remote workspace synchronization status changes. |
| loadingChange | Engine | boolean | Emitted when the combined loading state changes. |
| isPublicChange | Editor | IKritzelIsPublicChangedEvent | Emitted when workspace public sharing status changes. |

### Methods

#### createWorkspace

Creates a new workspace and emits a `workspacesChange` event.

```ts
createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null>
```

#### updateWorkspace

Updates an existing workspace's metadata and emits a `workspacesChange` event.

```ts
updateWorkspace(workspace: KritzelWorkspace): Promise<void>
```

#### deleteWorkspace

Deletes a workspace and emits a `workspacesChange` event.

```ts
deleteWorkspace(workspace: KritzelWorkspace): Promise<void>
```

#### getWorkspaces

Returns all available workspaces.

```ts
getWorkspaces: Promise<KritzelWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace: Promise<KritzelWorkspace>
```

---

## Tool Management

### Props

| Property | Component | Type | Description |
|----------|-----------|------|-------------|
| toolbarItems | Editor | KritzelToolbarItem[] | Toolbar items and tool configuration. |

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| activeToolChange | Engine | KritzelBaseTool | Emitted when the active drawing tool changes. |

### Methods

#### registerTool

Registers a new drawing tool with the engine.

```ts
registerTool(
  toolName: string,
  toolClass: any,
  toolConfig?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelTextToolConfig | KritzelShapeToolConfig
): Promise<KritzelBaseTool>
```

#### changeActiveTool

Switches the active drawing tool. Deactivates the current tool and clears any selection.

```ts
changeActiveTool(tool: KritzelBaseTool): Promise<void>
```

#### disable

Disables all user interaction with the engine (pointer, keyboard, etc.).

```ts
disable: Promise<void>
```

#### enable

Re-enables user interaction after a call to `disable`.

```ts
enable: Promise<void>
```

---

## Clipboard & Editing

### Props

No clipboard-specific props.

### Events

No clipboard-specific events.

### Methods

#### copy

Copies the currently selected objects to the internal clipboard.

```ts
copy: Promise<void>
```

#### paste

Pastes previously copied objects at the specified world coordinates.

```ts
paste(x: number, y: number): Promise<void>
```

#### delete

Deletes the currently selected objects from the canvas.

```ts
delete: Promise<void>
```

---

## Ordering

### Props

No ordering-specific props.

### Events

No ordering-specific events.

### Methods

#### bringForward

Moves an object one layer forward in the z-order. If omitted, applies to the current selection.

```ts
bringForward(object?: KritzelBaseObject): Promise<void>
```

#### sendBackward

Moves an object one layer backward in the z-order. If omitted, applies to the current selection.

```ts
sendBackward(object?: KritzelBaseObject): Promise<void>
```

#### bringToFront

Moves an object to the very front of the z-order. If omitted, applies to the current selection.

```ts
bringToFront(object?: KritzelBaseObject): Promise<void>
```

#### sendToBack

Moves an object to the very back of the z-order. If omitted, applies to the current selection.

```ts
sendToBack(object?: KritzelBaseObject): Promise<void>
```

---

## Alignment

### Props

No alignment-specific props.

### Events

No alignment-specific events.

### Methods

#### alignObjects

Aligns the currently selected objects according to the specified alignment.

```ts
alignObjects(alignment: KritzelAlignment): Promise<void>
```

Alignment values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

---

## Grouping

### Props

No grouping-specific props.

### Events

No grouping-specific events.

### Methods

#### group

Groups the currently selected objects into a single group.

```ts
group: Promise<void>
```

#### ungroup

Ungroups the currently selected group back into individual objects.

```ts
ungroup: Promise<void>
```

---

## Undo & Redo

### Props

No undo/redo-specific props.

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| undoStateChange | Both | KritzelUndoState | Emitted when undo/redo availability changes. |

### Methods

#### undo

Undoes the last action.

```ts
undo: Promise<void>
```

#### redo

Redoes the last undone action.

```ts
redo: Promise<void>
```

---

## Export

### Props

No export-specific props.

### Events

No export-specific events.

### Methods

#### getScreenshot

Captures a screenshot of the current viewport as a data URL.

```ts
getScreenshot(format?: 'png' | 'svg'): Promise<string>
```

#### exportViewportAsPng

Exports the current viewport as a PNG file and triggers a browser download.

```ts
exportViewportAsPng: Promise<void>
```

#### exportViewportAsSvg

Exports the current viewport as an SVG file and triggers a browser download.

```ts
exportViewportAsSvg: Promise<void>
```

---

## Other

### Props

| Property | Component | Type | Description |
|----------|-----------|------|-------------|
| assetStorageConfig | Both | KritzelAssetStorageConfig | Asset storage configuration for images and binary data. |
| cursorTarget | Both | HTMLElement | Element used as cursor style target. |
| customFonts | Editor | KritzelFontMap | Registers custom fonts for rendering and text tools. |
| customSvgIcons | Editor | string | Custom SVG icon definitions. |
| debugInfo | Both | KritzelDebugInfo | Debug overlay configuration options. |
| editorId | Both | string | Optional unique identifier used to namespace storage keys. |
| fallbackLocale | Both | LocaleCode | Locale used for missing translations. |
| globalContextMenuItems | Both | ContextMenuItem[] | Context menu items for the canvas background. |
| isMoreMenuVisible | Editor | boolean | Show or hide the More menu. |
| isToolbarVisible | Editor | boolean | Show or hide the toolbar. |
| isUtilityPanelVisible | Editor | boolean | Show or hide the utility panel. |
| isWorkspaceManagerVisible | Editor | boolean | Show or hide the workspace manager toggle. |
| isZoomPanelVisible | Editor | boolean | Show or hide the zoom control panel. |
| licenseKey | Both | string | Valid key removes the Powered by Kritzel watermark. |
| locale | Both | LocaleCode | Current active locale code. |
| locales | Both | KritzelLocale[] | Available locale definitions with optional overrides. |
| lockDrawingScale | Both | boolean | Keep drawn objects at fixed visual size across zoom levels. |
| loginConfig | Editor | KritzelLoginConfig | Login provider dialog configuration. |
| moreMenuItems | Editor | IKritzelMenuItem[] | Custom entries for the More dropdown menu. |
| objectContextMenuItems | Both | ContextMenuItem[] | Context menu items for selected objects. |
| theme | Both | ThemeCode | Current active theme. |
| themes | Both | KritzelTheme[] | Available theme definitions. |

### Events

| Event | Component | Payload Type | Description |
|-------|-----------|--------------|-------------|
| contextMenuStateChange | Engine | KritzelContextMenuState | Emitted when context menu state changes. |
| isEngineReady | Engine | KritzelEngineState | Emitted when the engine is fully initialized and ready. |
| isReady | Editor | EditorIsReadyEvent | Emitted when the editor is fully initialized and ready. |
| localeChange | Editor | LocaleCode | Emitted when the active locale changes. |
| login | Editor | LoginEvent | Emitted when login is triggered from the provider dialog. |
| logout | Editor | void | Emitted when the user logs out from the menu. |
| longpress | Engine | PointerEvent | Emitted on long press, useful for mobile context menus. |
| notificationsChange | Engine | KritzelNotification | Emitted when notifications change. |
| themeChange | Editor | ThemeCode | Emitted when the active theme changes. |

### Methods

#### hideContextMenu

Hides the context menu and resets any associated selection state.

```ts
hideContextMenu: Promise<void>
```

#### getDisplayableShortcuts

Returns all registered keyboard shortcuts (without action/condition) for display in a help UI.

```ts
getDisplayableShortcuts: Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]>
```
