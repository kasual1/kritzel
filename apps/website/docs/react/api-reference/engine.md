---

sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine API Reference | Kritzel for React"
description: "Complete API reference for the headless Kritzel engine: rendering, viewport, pointer events, and workspace management."
toc_max_heading_level: 2
---

# Engine

The `<KritzelEngine>` is the low-level headless canvas primitive. It handles rendering, viewport management, pointer events, undo/redo, and workspace management with no built-in controls.

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
findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject) => boolean): Promise<T[]>
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
| objectsInViewportChange | KritzelBaseObject[] | Emitted when the set of objects visible in the current viewport changes. |

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
| activeWorkspaceId | string | Optional workspace ID to load. |
| workspaces | KritzelWorkspace[] | Optional authoritative workspace catalog for this engine instance. |
| syncConfig | KritzelSyncConfig | Configuration for synchronization providers. |
| user | IKritzelUser | Current user for awareness broadcasting. |
| isLoading | boolean | External loading state merged with internal workspace loading state. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeWorkspaceChange | KritzelWorkspace | Emitted when the active workspace changes. |
| workspacesChange | KritzelWorkspace[] | Emitted when workspaces are created, updated, or deleted. |
| awarenessChange | AwarenessStateMap | Emitted when awareness state changes. |
| syncingChange | boolean | Emitted when remote workspace synchronization status changes. |
| loadingChange | boolean | Emitted when the combined loading state changes. |

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
  toolConfig?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelTextToolConfig | KritzelShapeToolConfig
): Promise<KritzelBaseTool | null>
```

#### setActiveTool

Switches the active drawing tool. Deactivates the current tool and clears any selection.

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

Cuts the currently selected objects to the internal clipboard and removes them from the canvas.

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

Moves an object one layer forward in the z-order, past the next layer above it. If omitted, applies to the current selection and moves each selected layer. A group is one layer, so all of its children move together; a grouped object moves within its group.

```ts
bringForward(object?: KritzelBaseObject): Promise<void>
```

#### sendBackward

Moves an object one layer backward in the z-order, past the next layer below it. If omitted, applies to the current selection and moves each selected layer. A group is one layer, so all of its children move together; a grouped object moves within its group.

```ts
sendBackward(object?: KritzelBaseObject): Promise<void>
```

#### bringToFront

Moves an object to the very front of the z-order. If omitted, applies to the current selection, keeping the relative order of the selected layers. A group moves together with all of its children; a grouped object moves to the front of its group.

```ts
bringToFront(object?: KritzelBaseObject): Promise<void>
```

#### sendToBack

Moves an object to the very back of the z-order. If omitted, applies to the current selection, keeping the relative order of the selected layers. A group moves together with all of its children; a grouped object moves to the back of its group.

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

Creates a group (`KritzelGroup`) from the currently selected objects (at least two). They become one layer at the position of the topmost selected object.

```ts
group(): Promise<void>
```

#### ungroup

Ungroups the selected groups. Their children become individual objects again and keep their stacking order.

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

Checks whether the currently selected object supports a specific export format.

```ts
canExportSelectedObjectAs(format: KritzelObjectExportFormat): Promise<boolean>
```

#### exportSelectedObject

Exports the currently selected object in the specified format.

```ts
exportSelectedObject(format: KritzelObjectExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

Returns the export formats supported by the currently selected object.

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

Loads objects from workspace JSON into the current workspace.

```ts
loadObjectsFromJson(json: string): Promise<number>
```

#### downloadAsJson

Downloads the current workspace as JSON.

```ts
downloadAsJson(filename?: string): Promise<void>
```

#### importFromFile

Opens a file picker and imports the selected JSON file.

```ts
importFromFile(): Promise<void>
```

---

## Localization & Settings

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale code. |
| locales | KritzelLocale[] | Available locale definitions. |
| theme | ThemeCode | Current theme. |
| themes | KritzelTheme[] | Available themes. |

### Events

No localization/settings-specific events.

### Methods

#### registerLocales

```ts
registerLocales(locales: KritzelLocale[]): Promise<void>
```

#### setLocale

```ts
setLocale(code: LocaleCode): Promise<void>
```

#### getLocale

```ts
getLocale(): Promise<LocaleCode>
```

#### getAvailableLocales

```ts
getAvailableLocales(): Promise<LocaleCode[]>
```

#### getAvailableLocaleOptions

```ts
getAvailableLocaleOptions(): Promise<{ code: LocaleCode; label: string }[]>
```

#### t

```ts
t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>
```

#### getResolvedTerms

```ts
getResolvedTerms(): Promise<Partial<Record<KritzelTermKey, string>>>
```

#### saveSettings

```ts
saveSettings(settings: KritzelSettingsConfig): Promise<void>
```

#### loadSettings

```ts
loadSettings(): Promise<Partial<KritzelSettingsConfig> | null>
```

---

## Context Menu & Lifecycle

### Props

| Property | Type | Description |
|----------|------|-------------|
| assetStorageConfig | KritzelAssetStorageConfig | Binary asset storage provider configuration. |
| cursorTarget | HTMLElement | Element to apply cursor styles to. |
| debugInfo | KritzelDebugInfo | Debug overlay configuration. |
| editorId | string | Identifier for namespacing storage keys. |
| globalContextMenuItems | ContextMenuItem[] | Canvas background menu items. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Kritzel" watermark (default `true`). Keeping it visible helps support the project. |
| lockDrawingScale | boolean | Keeps objects at a fixed visual size across zoom. |
| objectContextMenuItems | ContextMenuItem[] | Selected-object menu items. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| contextMenuStateChange | KritzelContextMenuState | Emitted when context-menu state changes. |
| isEngineReady | KritzelEngineState | Emitted when the engine is ready. |
| longpress | PointerEvent | Emitted on touch or pen long-press. |
| notificationsChange | KritzelNotification | Emitted when notifications change. |

### Methods

#### openContextMenu

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

```ts
beginSceneBootstrap(): Promise<void>
```

#### endSceneBootstrap

```ts
endSceneBootstrap(): Promise<void>
```

## Agentic Cursors

### Props

No agentic-cursor-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| agenticCursorDetached | KritzelAgenticCursorDetachedEvent | Emitted when an agentic cursor is detached from an object, either manually or because the object was removed. |

### Methods

#### addAgenticCursor

Adds a programmatically controlled cursor. Agentic cursors are rendered locally only.

```ts
addAgenticCursor(options?: KritzelAgenticCursorOptions): Promise<KritzelAgenticCursor>
```

#### updateAgenticCursor

Updates the name, color, status or visibility of an agentic cursor. Pass `status: null` to clear the status.

```ts
updateAgenticCursor(id: string, patch: KritzelAgenticCursorPatch): Promise<KritzelAgenticCursor>
```

#### moveAgenticCursor

Smoothly moves an agentic cursor to world coordinates or to an anchor on an object. Object targets attach the cursor by default. Resolves when the animation ends; `completed` is `false` if the move was interrupted.

```ts
moveAgenticCursor(id: string, target: KritzelAgenticCursorTarget, options?: KritzelAgenticCursorMoveOptions): Promise<KritzelAgenticCursorMoveResult>
```

#### detachAgenticCursor

Detaches an agentic cursor from its object. The cursor stays at its current position.

```ts
detachAgenticCursor(id: string): Promise<void>
```

#### removeAgenticCursor

Removes an agentic cursor. A running move resolves with `completed: false`.

```ts
removeAgenticCursor(id: string): Promise<boolean>
```

#### clearAgenticCursors

Removes all agentic cursors.

```ts
clearAgenticCursors(): Promise<void>
```

#### getAgenticCursor

Returns a snapshot of an agentic cursor, or `null` if it doesn't exist.

```ts
getAgenticCursor(id: string): Promise<KritzelAgenticCursor | null>
```

#### getAgenticCursors

Returns snapshots of all agentic cursors.

```ts
getAgenticCursors(): Promise<KritzelAgenticCursor[]>
```
