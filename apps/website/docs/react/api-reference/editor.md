---

sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor API Reference | Kritzel for React"
description: "Complete API reference for the Kritzel editor component: props, methods, and events available in React."
toc_max_heading_level: 2
---

# Editor

The `<KritzelEditor>` is the high-level, full-featured whiteboard component. It wraps `<KritzelEngine>` and adds a toolbar, utility panel, context menus, dialogs, and workspace management.

## General

### Props

| Property | Type | Description |
|----------|------|-------------|
| isLoading | boolean | Whether the editor is currently loading. |
| assetStorageConfig | KritzelAssetStorageConfig | Asset storage provider configuration. |
| debugInfo | KritzelDebugInfo | Debug overlay configuration. |
| editorId | string | Identifier for namespacing storage keys. |
| licenseKey | string | Valid key removes the watermark. |
| lockDrawingScale | boolean | Keeps drawn objects at a fixed visual size across zoom. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| isReady | EditorIsReadyEvent | Emitted when the editor is initialized and ready. |

### Methods

#### beginSceneBootstrap

```ts
beginSceneBootstrap(): Promise<void>
```

#### endSceneBootstrap

```ts
endSceneBootstrap(): Promise<void>
```

---

## UI Elements

### Props

| Property | Type | Description |
|----------|------|-------------|
| cursorTarget | HTMLElement | Element used as the cursor target. |
| customSvgIcons | string | Custom SVG icon definitions. |
| globalContextMenuItems | ContextMenuItem[] | Canvas background menu items. |
| isMoreMenuVisible | boolean | Controls More menu visibility. |
| isToolbarVisible | boolean | Controls toolbar visibility. |
| isUtilityPanelVisible | boolean | Controls utility panel visibility. |
| isWorkspaceManagerVisible | boolean | Controls workspace manager visibility. |
| isZoomPanelVisible | boolean | Controls zoom panel visibility. |
| moreMenuItems | IKritzelMenuItem[] | Custom More menu entries. |
| objectContextMenuItems | ContextMenuItem[] | Selected-object menu items. |

### Events

No UI-specific events.

### Methods

#### openContextMenu

```ts
openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>
```

#### openWorkspaceManagerMenu

```ts
openWorkspaceManagerMenu(): Promise<void>
```

#### openMoreMenu

```ts
openMoreMenu(): Promise<void>
```

#### hideContextMenu

```ts
hideContextMenu(): Promise<void>
```

#### getDisplayableShortcuts

```ts
getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, "action" | "condition">[]>
```

#### triggerNotification

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
| objectsAdded | ObjectsAddedEvent | Emitted when objects are added. |
| objectsChange | KritzelBaseObject[] | Emitted when objects change. |
| objectsRemoved | ObjectsRemovedEvent | Emitted when objects are removed. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when objects are updated. |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### addObjects

```ts
addObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### removeObjects

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
| isPanningEnabled | boolean | Enables regular-wheel panning. |
| isZoomingEnabled | boolean | Enables Ctrl+wheel zooming. |
| scaleMax | number | Maximum zoom scale. |
| scaleMin | number | Minimum zoom scale. |
| viewportBoundaryBottom | number | Bottom pan boundary. |
| viewportBoundaryLeft | number | Left pan boundary. |
| viewportBoundaryRight | number | Right pan boundary. |
| viewportBoundaryTop | number | Top pan boundary. |

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

```ts
panToObject(object: KritzelBaseObject): Promise<void>
```

#### zoomTo

Zooms the viewport to the given scale. Optionally centers on a world point; if omitted, zooms around the viewport center.

```ts
zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>
```

#### zoomIn

```ts
zoomIn(factor?: number, duration?: number): Promise<void>
```

#### zoomOut

```ts
zoomOut(factor?: number, duration?: number): Promise<void>
```

#### centerObjectInViewport

Moves the given object to the center of the viewport. Use `panToObject` or `centerObjects` to move the camera instead.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject<HTMLElement | SVGElement>>
```

#### centerObjects

```ts
centerObjects(objects: KritzelBaseObject[], animate?: boolean): Promise<boolean>
```

#### centerAllObjects

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
| activeWorkspaceId | string | Optional workspace ID to activate. |
| workspaces | KritzelWorkspace[] | Optional authoritative workspace catalog. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeWorkspaceChange | ActiveWorkspaceChangeEvent | Emitted when the active workspace changes. |
| isPublicChange | IKritzelIsPublicChangeEvent | Emitted when public sharing status changes. |

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

```ts
canExportSelectedObjectAs(format: KritzelObjectExportFormat): Promise<boolean>
```

#### exportSelectedObject

```ts
exportSelectedObject(format: KritzelObjectExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

```ts
getSelectedObjectSupportedExportFormats(): Promise<KritzelObjectExportFormat[]>
```

#### exportAsJson

```ts
exportAsJson(): Promise<string>
```

#### importFromJson

```ts
importFromJson(json: string): Promise<void>
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
| customFonts | KritzelFontMap | Fonts available to rendering and text tools. |
| theme | ThemeCode | Current theme. |
| themes | KritzelTheme[] | Available theme definitions. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| themeChange | ThemeCode | Emitted when the active theme changes. |

### Methods

#### registerFonts

```ts
registerFonts(fonts: KritzelFontMap): Promise<void>
```

---

## Localization

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used for missing terms. |
| locale | LocaleCode | Current locale. |
| locales | KritzelLocale[] | Available locale definitions. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| localeChange | LocaleCode | Emitted when the active locale changes. |

### Methods

#### registerLocales

```ts
registerLocales(locales: KritzelLocale[]): Promise<void>
```

#### getAvailableLocales

```ts
getAvailableLocales(): Promise<LocaleCode[]>
```

#### getLocale

```ts
getLocale(): Promise<LocaleCode>
```

#### setLocale

```ts
setLocale(code: LocaleCode): Promise<void>
```

#### t

```ts
t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>
```

---

## User Management

### Props

| Property | Type | Description |
|----------|------|-------------|
| user | IKritzelUser | Current authenticated user. |
| loginConfig | KritzelLoginConfig | Login provider configuration. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| login | LoginEvent | Emitted when login is triggered. |
| logout | void | Emitted when logout is triggered. |

### Methods

#### openLoginDialog

```ts
openLoginDialog(): Promise<void>
```

#### setLoginLoading

```ts
setLoginLoading(provider: string | null): Promise<void>
```

---

## Collaboration

### Props

| Property | Type | Description |
|----------|------|-------------|
| activeUsers | IKritzelUser[] | Other users in the session. |
| syncConfig | KritzelSyncConfig | Collaboration provider configuration. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| awarenessChange | AwarenessStateMap | Emitted when awareness state changes. |

### Methods

#### reinitSync

```ts
reinitSync(): Promise<void>
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
