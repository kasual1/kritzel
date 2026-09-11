---

sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine API Reference | Kritzel for Angular"
description: "Complete API reference for the headless Kritzel engine: rendering, viewport, pointer events, and workspace management."
toc_max_heading_level: 2
---

# Engine

The `<kritzel-engine>` is the low-level headless canvas primitive. It handles rendering, viewport management, pointer events, undo/redo, and workspace management with no built-in controls.

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

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectsSelectionChange | void | Emitted when the set of selected objects changes. |

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
| objectsInViewportChange | KritzelBaseObject[] | Emitted when the set of objects visible in the current viewport changes (for example after pan/zoom). |

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
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject>
```

#### centerObjects

Pans and zooms the viewport to fit the provided objects.

```ts
centerObjects(objects: KritzelBaseObject[], animate?: boolean): Promise<boolean>
```

#### centerAllObjects

Pans and zooms the viewport to fit ALL objects on the canvas, including those not currently rendered.

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
| activeWorkspaceId | string | Optional workspace ID to load. If provided, the engine automatically loads this workspace by ID. |
| workspaces | KritzelWorkspace[] | Optional authoritative workspace catalog for this engine instance. Provider-only workspaces are hidden but not deleted. |
| syncConfig | KritzelSyncConfig | Configuration for real-time synchronization providers (for example IndexedDB/WebSocket). |
| user | IKritzelUser | Current user for awareness broadcasting (name, id, cursor position). |
| isLoading | boolean | External loading state merged with internal workspace loading state. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeWorkspaceChange | KritzelWorkspace | Emitted when the active workspace changes (for example after import or switching workspaces). |
| workspacesChange | KritzelWorkspace[] | Emitted when workspaces are created, updated, or deleted. |
| awarenessChange | AwarenessStateMap | Emitted when awareness state changes (remote user cursors/presence). |
| syncingChange | boolean | Emitted when remote workspace synchronization status changes. |
| loadingChange | boolean | Emitted when the combined loading state changes (external isLoading or internal workspace loading). |

### Methods

#### setActiveWorkspace

Switches the active workspace shown in the engine by ID.

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

#### getIsPublic

Gets whether the active workspace is publicly accessible.

```ts
getIsPublic(): Promise<boolean>
```

#### loadSharedWorkspace

Loads a workspace shared externally using a secure access token.

```ts
loadSharedWorkspace(token: string): Promise<void>
```

#### reinitSync

Reinitializes the active synchronization provider connection.

```ts
reinitSync(): Promise<void>
```

---

## Tool Management

### Props

No tool-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeToolChange | KritzelBaseTool | Emitted when the active drawing tool changes. |

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

#### changeActiveTool

Switches the active drawing tool by its registered name.

```ts
changeActiveTool(toolName: string): Promise<void>
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

Cuts the currently selected objects to the internal clipboard (deletes them from the canvas).

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

Captures a screenshot of the current viewport as a data URL.

```ts
getScreenshot(format?: "png" | "svg", options?: { includeBackground?: boolean }): Promise<string | null>
```

#### exportViewportAsPng

Exports the current viewport as a PNG file and triggers a browser download.

```ts
exportViewportAsPng(options?: { includeBackground?: boolean }): Promise<void>
```

#### exportViewportAsSvg

Exports the current viewport as an SVG file and triggers a browser download.

```ts
exportViewportAsSvg(options?: { includeBackground?: boolean }): Promise<void>
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

#### exportAsJson

Exports the current workspace and all its objects as a JSON string.

```ts
exportAsJson(): Promise<string>
```

#### importFromJson

Imports a workspace from a JSON string into a new workspace.

```ts
importFromJson(json: string): Promise<void>
```

#### loadObjectsFromJson

Loads objects from a workspace JSON string into the current workspace.

```ts
loadObjectsFromJson(json: string): Promise<number>
```

#### downloadAsJson

Exports the current workspace as a JSON file and triggers a browser download.

```ts
downloadAsJson(filename?: string): Promise<void>
```

#### importFromFile

Opens a file picker dialog and imports the selected JSON file into the workspace.

```ts
importFromFile(): Promise<void>
```

---

## Localization & Settings

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale (language) code applied to the editor, for example en, de, fr. |
| locales | KritzelLocale[] | Available locale definitions with optional partial term overrides. |
| theme | ThemeCode | Current theme applied to the editor. |
| themes | KritzelTheme[] | Available themes for the editor. |

### Events

No localization/settings-specific events.

### Methods

#### registerLocales

Registers additional locale definitions (with optional partial term overrides).

```ts
registerLocales(locales: KritzelLocale[]): Promise<void>
```

#### setLocale

Sets the active locale (language) and re-renders the UI.

```ts
setLocale(code: LocaleCode): Promise<void>
```

#### getLocale

Gets the currently active locale code.

```ts
getLocale(): Promise<LocaleCode>
```

#### getAvailableLocales

Gets the list of available locale codes (built-in and registered).

```ts
getAvailableLocales(): Promise<LocaleCode[]>
```

#### getAvailableLocaleOptions

Gets the list of available locales as `{ code, label }` options.

```ts
getAvailableLocaleOptions(): Promise<{ code: LocaleCode; label: string }[]>
```

#### t

Resolves a term key to its translated string for the active locale.

```ts
t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>
```

#### getResolvedTerms

Resolves every known term key for the active locale into a flat map.

```ts
getResolvedTerms(): Promise<Partial<Record<KritzelTermKey, string>>>
```

#### saveSettings

Persists the given settings object to localStorage.

```ts
saveSettings(settings: KritzelSettingsConfig): Promise<void>
```

#### loadSettings

Loads the persisted settings object from localStorage.

```ts
loadSettings(): Promise<Partial<KritzelSettingsConfig> | null>
```

---

## Context Menu & Lifecycle

### Props

| Property | Type | Description |
|----------|------|-------------|
| assetStorageConfig | KritzelAssetStorageConfig | Configuration for binary asset storage providers (for example image bytes and remote asset sync). |
| cursorTarget | HTMLElement | HTML element to apply cursor styles to. Defaults to document.body if not set. |
| debugInfo | KritzelDebugInfo | Controls which debug overlays are visible. |
| editorId | string | Optional unique identifier for namespacing storage keys across multiple engine instances. |
| globalContextMenuItems | ContextMenuItem[] | Context menu items shown when right-clicking the canvas background. |
| licenseKey | string | Valid key removes the Powered by Kritzel watermark. |
| lockDrawingScale | boolean | Keep drawn objects at a fixed visual size regardless of zoom. |
| objectContextMenuItems | ContextMenuItem[] | Context menu items shown when right-clicking selected objects. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| contextMenuStateChange | KritzelContextMenuState | Emitted when context-menu visibility, items, or position changes. |
| isEngineReady | KritzelEngineState | Emitted when the engine has fully initialized and is ready for interaction. |
| longpress | PointerEvent | Emitted on long-press (touch/pen), useful for showing custom context menus on mobile. |
| notificationsChange | KritzelNotification | Emitted when notifications change. |

### Methods

#### openContextMenu

Programmatically opens the context menu at a specified world-coordinate position.

```ts
openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>
```

#### hideContextMenu

Hides the context menu and resets any associated selection state.

```ts
hideContextMenu(): Promise<void>
```

#### getDisplayableShortcuts

Returns all registered keyboard shortcuts (without action/condition) for display in a help UI.

```ts
getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, "action" | "condition">[]>
```

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
