---
sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor API Reference | Kritzel for Angular"
description: "Complete API reference for the Kritzel editor component: props, methods, and events available in Angular."
toc_max_heading_level: 2
---

# Editor

The `<kritzel-editor>` is the high-level, full-featured whiteboard component. It wraps `<kritzel-engine>` and adds a toolbar, utility panel, context menus, dialogs, and workspace management.

## General

### Props

| Property | Type | Description |
|----------|------|-------------|
| isLoading | boolean | Whether the editor is currently in a loading state. |
| assetStorageConfig | KritzelAssetStorageConfig | Asset storage provider configuration for uploaded/rendered assets. |
| debugInfo | KritzelDebugInfo | Debug overlay configuration options. |
| editorId | string | Optional editor identifier for namespacing storage keys across instances. |
| lockDrawingScale | boolean | Keeps drawn objects at fixed visual size across zoom levels. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| isReady | EditorIsReadyEvent | Emitted when the editor is fully initialized and ready. |

### Methods

#### beginSceneBootstrap

Starts a scene bootstrap phase by hiding the scene immediately.

```ts
beginSceneBootstrap(): Promise<void>
```

#### endSceneBootstrap

Ends the scene bootstrap phase.

```ts
endSceneBootstrap(): Promise<void>
```

---

## UI Elements

### Props

| Property | Type | Description |
|----------|------|-------------|
| cursorTarget | HTMLElement | Element used as cursor target. Defaults to editor container if omitted. |
| customSvgIcons | string | Custom SVG icon definitions. |
| globalContextMenuItems | ContextMenuItem[] | Context menu items shown on canvas background. |
| isMoreMenuVisible | boolean | Controls visibility of the More menu. |
| isToolbarVisible | boolean | Controls toolbar visibility. |
| isUtilityPanelVisible | boolean | Controls utility panel visibility. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Kritzel" watermark (default `true`). Keeping it visible helps support the project. |
| isWorkspaceManagerVisible | boolean | Controls workspace manager visibility. |
| isZoomPanelVisible | boolean | Controls zoom panel visibility. |
| moreMenuItems | IKritzelMenuItem[] | Custom entries for the More dropdown menu. |
| objectContextMenuItems | ContextMenuItem[] | Context menu items shown for selected objects. |

### Events

No UI-specific events.

### Methods

#### openContextMenu

Opens a context menu programmatically at the given screen coordinates.

```ts
openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>
```

#### openWorkspaceManagerMenu

Opens the built-in workspace manager menu programmatically.

```ts
openWorkspaceManagerMenu(): Promise<void>
```

#### openMoreMenu

Opens the built-in More menu programmatically.

```ts
openMoreMenu(): Promise<void>
```

#### hideContextMenu

Hides the active context menu.

```ts
hideContextMenu(): Promise<void>
```

#### getDisplayableShortcuts

Returns all registered keyboard shortcuts (without action/condition) for display in a help UI.

```ts
getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, "action" | "condition">[]>
```

#### triggerNotification

Triggers a UI notification programmatically.

```ts
triggerNotification(notification: Omit<KritzelNotification, "id"> & Partial<Pick<KritzelNotification, "id" | "timestamp">>): Promise<void>
```

---

## Object

### Props

No object-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectsAdded | ObjectsAddedEvent | Emitted when one or more objects are added to the canvas. |
| objectsChange | KritzelBaseObject[] | Emitted when objects on the canvas are added, removed, or modified. |
| objectsRemoved | ObjectsRemovedEvent | Emitted when one or more objects are removed from the canvas. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when one or more objects are updated on the canvas. |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### addObjects

Adds multiple objects to the canvas in a single batch operation within one undo step and render cycle.

```ts
addObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### removeObjects

Removes multiple objects from the canvas in a single batch operation.

```ts
removeObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]>
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
getAllObjects<T extends KritzelBaseObject>(): Promise<T[]>
```

#### findObjects

Returns all objects matching the given predicate. Excludes internal selection-related objects.

```ts
findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject<Element>) => boolean): Promise<T[]>
```

#### getObjectsTotalCount

Returns the total number of objects on the canvas.

```ts
getObjectsTotalCount(): Promise<number>
```

#### getObjectsInViewport

Returns all objects currently visible within the viewport bounds.

```ts
getObjectsInViewport(): Promise<KritzelBaseObject[]>
```

---

## Selection

### Props

No selection-specific props.

### Events

No selection-specific events.

### Methods

#### getSelectedObjects

Returns the currently selected objects. Returns an empty array if nothing is selected.

```ts
getSelectedObjects(): Promise<KritzelBaseObject[]>
```

#### selectObjects

Programmatically selects the given objects. Switches to the selection tool automatically.

```ts
selectObjects(objects: KritzelBaseObject[]): Promise<void>
```

#### selectAllObjectsInViewport

Selects all objects currently visible in the viewport. Switches to the selection tool automatically.

```ts
selectAllObjectsInViewport(): Promise<void>
```

#### clearSelection

Deselects all currently selected objects.

```ts
clearSelection(): Promise<void>
```

#### triggerSelectionChange

Manually triggers the `objectsSelectionChange` event.

```ts
triggerSelectionChange(): Promise<void>
```

---

## Viewport & Navigation

### Props

| Property | Type | Description |
|----------|------|-------------|
| isPanningEnabled | boolean | Enable or disable viewport panning via regular wheel input. |
| isZoomingEnabled | boolean | Enable or disable viewport zooming via Ctrl+wheel. |
| scaleMax | number | Maximum zoom scale allowed. |
| scaleMin | number | Minimum zoom scale allowed. |
| viewportBoundaryBottom | number | Bottom pan boundary in world coordinates. |
| viewportBoundaryLeft | number | Left pan boundary in world coordinates. |
| viewportBoundaryRight | number | Right pan boundary in world coordinates. |
| viewportBoundaryTop | number | Top pan boundary in world coordinates. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| viewportChange | KritzelViewportState | Emitted on viewport pan, zoom, or resize. |

### Methods

#### getViewport

Returns the current viewport state including position, scale, and dimensions.

```ts
getViewport(): Promise<KritzelViewportState>
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

#### panToObject

Pans the viewport to center on the specified object without changing the scale.

```ts
panToObject(object: KritzelBaseObject): Promise<void>
```

#### zoomTo

Zooms the viewport to the given scale. Optionally centers on a world point; if omitted, zooms around the viewport center.

```ts
zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>
```

#### zoomIn

Zooms into the viewport by a specified factor over an optional duration.

```ts
zoomIn(factor?: number, duration?: number): Promise<void>
```

#### zoomOut

Zooms out of the viewport by a specified factor over an optional duration.

```ts
zoomOut(factor?: number, duration?: number): Promise<void>
```

#### centerObjectInViewport

Moves the given object to the center of the current viewport and returns the updated object. Use `panToObject` or `centerObjects` when you want to move the camera instead.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject<HTMLElement | SVGElement>>
```

#### centerObjects

Pans and zooms the viewport to fit the provided objects.

```ts
centerObjects(objects: KritzelBaseObject[], animate?: boolean): Promise<boolean>
```

#### centerAllObjects

Pans and zooms the viewport to fit all objects on the canvas, including those not currently rendered.

```ts
centerAllObjects(animate?: boolean): Promise<boolean>
```

#### backToContent

Pans and zooms the viewport to fit the nearest content, with padding. Useful when the user has panned away from all objects.

```ts
backToContent(): Promise<boolean>
```

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

| Property | Type | Description |
|----------|------|-------------|
| activeWorkspaceId | string | Optional workspace ID to set as active. If provided, the editor auto-activates that workspace. |
| workspaces | KritzelWorkspace[] | Optional authoritative workspace catalog for this editor instance. Provider-only workspaces are hidden but not deleted. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeWorkspaceChange | ActiveWorkspaceChangeEvent | Emitted when the active workspace changes. |
| isPublicChange | IKritzelIsPublicChangeEvent | Emitted when workspace public sharing status toggles. |

### Methods

#### setActiveWorkspace

Switches the active workspace shown in the editor by ID.

```ts
setActiveWorkspace(id: string): Promise<void>
```

#### createWorkspace

Creates a new workspace and emits a `workspacesChange` event. Accepts a `KritzelWorkspace` instance.

```ts
createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null>
```

#### updateWorkspace

Applies a workspace as declared and emits a `workspacesChange` event. Metadata and viewport are always applied. When `workspace.objects` is set it is treated as the complete desired object set: objects are matched by ID, unknown IDs are added, known IDs are updated, and objects missing from the list are removed. Leave `objects` `undefined` to keep the current objects, or pass `[]` to remove them all. Updating the objects of a workspace that is not currently active requires a configured sync provider.

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
getWorkspaces(): Promise<KritzelWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace(): Promise<KritzelWorkspace>
```

#### loadSharedWorkspace

Loads a workspace shared externally using a secure access token.

```ts
loadSharedWorkspace(token: string): Promise<void>
```

---

## Tool Management

### Props

| Property | Type | Description |
|----------|------|-------------|
| toolbarItems | KritzelToolbarItem[] | Toolbar items and tool configuration. |

### Events

No tool-management-specific events.

### Methods

#### registerTool

Registers a new drawing tool with the engine.

```ts
registerTool(
  toolName: string,
  toolClass: any,
  toolConfig?: KritzelTextToolConfig | KritzelBrushToolConfig | KritzelLineToolConfig | KritzelShapeToolConfig
): Promise<KritzelBaseTool | null>
```

#### setActiveTool

Switches the active drawing tool by its registered name.

```ts
setActiveTool(toolName: string): Promise<void>
```

#### disable

Disables all user interaction with the engine (pointer, keyboard, etc.).

```ts
disable(): Promise<void>
```

#### enable

Re-enables user interaction after a call to `disable`.

```ts
enable(): Promise<void>
```

---

## Clipboard & Editing

### Props

No clipboard/editing-specific props.

### Events

No clipboard/editing-specific events.

### Methods

#### copy

Copies the currently selected objects to the internal clipboard.

```ts
copy(): Promise<void>
```

#### cut

Cuts the currently selected objects to the internal clipboard.

```ts
cut(): Promise<void>
```

#### paste

Pastes previously copied objects at the specified world coordinates.

```ts
paste(x: number, y: number): Promise<void>
```

#### delete

Deletes the currently selected objects from the canvas.

```ts
delete(): Promise<void>
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
bringForward(object?: KritzelBaseObject<any>): Promise<void>
```

#### sendBackward

Moves an object one layer backward in the z-order. If omitted, applies to the current selection.

```ts
sendBackward(object?: KritzelBaseObject<any>): Promise<void>
```

#### bringToFront

Moves an object to the very front of the z-order. If omitted, applies to the current selection.

```ts
bringToFront(object?: KritzelBaseObject<any>): Promise<void>
```

#### sendToBack

Moves an object to the very back of the z-order. If omitted, applies to the current selection.

```ts
sendToBack(object?: KritzelBaseObject<any>): Promise<void>
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

Groups the currently selected objects into a single group object.

```ts
group(): Promise<void>
```

#### ungroup

Ungroups the currently selected group back into individual objects.

```ts
ungroup(): Promise<void>
```

---

## Undo & Redo

### Props

No undo/redo-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| undoStateChange | KritzelUndoState | Emitted when undo/redo availability changes. |

### Methods

#### undo

Undoes the last action.

```ts
undo(): Promise<void>
```

#### redo

Redoes the last undone action.

```ts
redo(): Promise<void>
```

---

## Export & Import

### Props

No export/import-specific props.

### Events

No export/import-specific events.

### Methods

#### getScreenshot

Captures a screenshot of the current viewport as a data URL or blob.

```ts
getScreenshot(format?: "png" | "svg"): Promise<string | null>
```

#### exportViewportAsPng

Exports the current viewport as a PNG file and triggers a browser download.

```ts
exportViewportAsPng(): Promise<void>
```

#### exportViewportAsSvg

Exports the current viewport as an SVG file and triggers a browser download.

```ts
exportViewportAsSvg(): Promise<void>
```

#### canExportSelectedObjectAs

Checks whether the currently selected object supports a specific export format ("png" | "svg").

```ts
canExportSelectedObjectAs(format: KritzelObjectExportFormat): Promise<boolean>
```

#### exportSelectedObject

Exports the currently selected object in the specified format ("png" | "svg").

```ts
exportSelectedObject(format: KritzelObjectExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

Retrieves the array of export formats supported by the currently selected object.

```ts
getSelectedObjectSupportedExportFormats(): Promise<KritzelObjectExportFormat[]>
```

#### downloadAsJson

Downloads the canvas state as a JSON file. Use the optional filename directly.

```ts
downloadAsJson(filename?: string): Promise<void>
```

#### importFromFile

Triggers a local file selector, parsing the user's selected file to import objects.

```ts
importFromFile(): Promise<void>
```

#### loadObjectsFromJson

Hydrates the canvas with a serialized JSON string containing objects.

```ts
loadObjectsFromJson(json: string): Promise<number>
```

---

## Theming

### Props

| Property | Type | Description |
|----------|------|-------------|
| customFonts | KritzelFontMap | Registers fonts for runtime rendering and text-tool usage. |
| theme | ThemeCode | Current active theme. |
| themes | KritzelTheme[] | Available theme definitions. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| themeChange | ThemeCode | Emitted when the active theme changes. |

### Methods

#### registerFonts

Registers custom fonts for runtime rendering and text-tool usage.

```ts
registerFonts(fonts: KritzelFontMap): Promise<void>
```

---

## Localization

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale code used by the editor. |
| locales | KritzelLocale[] | Available locale definitions with optional term overrides. |

### Events

| Event | Payload Type | Description |
|----------|--------------|-------------|
| localeChange | LocaleCode | Emitted when the active locale changes. |

### Methods

#### registerLocales

Registers additional locale definitions (with optional partial term overrides).

```ts
registerLocales(locales: KritzelLocale[]): Promise<void>
```

#### getAvailableLocales

Gets the list of available locale codes (built-in and registered).

```ts
getAvailableLocales(): Promise<LocaleCode[]>
```

#### getLocale

Gets the currently active locale code.

```ts
getLocale(): Promise<LocaleCode>
```

#### setLocale

Sets the active locale (language) and re-renders the UI.

```ts
setLocale(code: LocaleCode): Promise<void>
```

#### t

Resolves a term key to its translated string for the active locale.

```ts
t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>
```

---

## User Management

### Props

| Property | Type | Description |
|----------|------|-------------|
| user | IKritzelUser | Current authenticated user for awareness/collaboration state. |
| loginConfig | KritzelLoginConfig | Login dialog provider configuration. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| login | LoginEvent | Emitted when login is triggered from the authentication dialog. |
| logout | void | Emitted when logout is triggered from the editor UI. |

### Methods

#### openLoginDialog

Opens the authentication/login modal with configured providers.

```ts
openLoginDialog(): Promise<void>
```

#### setLoginLoading

Indicates loading spinner state on a targeted provider during authentication.

```ts
setLoginLoading(provider: string | null): Promise<void>
```

---

## Collaboration

### Props

| Property | Type | Description |
|----------|------|-------------|
| activeUsers | IKritzelUser[] | Other users currently in the session. |
| syncConfig | KritzelSyncConfig | Real-time collaboration provider configuration. |

### Events

| Event | Payload Type | Description |
|----------|--------------|-------------|
| awarenessChange | AwarenessStateMap | Emitted when collaborative awareness state changes. |

### Methods

#### reinitSync

Reinitializes the active synchronization provider connection.

```ts
reinitSync(): Promise<void>
```

---

