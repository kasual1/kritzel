---

sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine API Reference | Kritzel for Vue"
description: "Complete API reference for the headless Kritzel engine: rendering, viewport, pointer events, and workspace management."
toc_max_heading_level: 2
---

# Engine

The `<KritzelEngine>` is the low-level headless canvas primitive. It handles rendering, viewport management, pointer events, undo/redo, and workspace management with no built-in controls.

All methods are async and return Promises. The `<KritzelEditor>` exposes all the same methods.

**Common props**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| cursorTarget | HTMLElement | document.body | Element to apply cursor styles to |
| globalContextMenuItems | ContextMenuItem[] | undefined | Context menu items for canvas background |
| objectContextMenuItems | ContextMenuItem[] | undefined | Context menu items for selected objects |
| lockDrawingScale | boolean | true | Fixed visual size for drawn objects regardless of zoom |
| scaleMax | number | ABSOLUTE_SCALE_MAX | Maximum zoom scale |
| scaleMin | number | ABSOLUTE_SCALE_MIN | Minimum zoom scale |
| syncConfig | KritzelSyncConfig | undefined | Sync provider configuration |
| theme | 'light' \| 'dark' | 'light' | Active theme |
| viewportBoundaryLeft | number | -Infinity | Left pan boundary |
| viewportBoundaryRight | number | Infinity | Right pan boundary |
| viewportBoundaryTop | number | -Infinity | Top pan boundary |
| viewportBoundaryBottom | number | Infinity | Bottom pan boundary |
| workspaces | KritzelWorkspace[] | undefined | Optional authoritative workspace catalog for this engine instance. Provider-only workspaces are hidden but not deleted. |

**Common events**

| Event | Payload Type | Description |
|-------|-------------|-------------|
| isEngineReady | KritzelEngineState | Emitted when the engine is fully initialized |
| activeToolChange | KritzelBaseTool | Emitted when the active tool changes |
| longpress | PointerEvent | Emitted on long-press (useful for mobile context menus) |
| objectsChange | KritzelBaseObject[] | Emitted when objects are added, removed, or modified |
| objectsAdded | ObjectsAddedEvent | Emitted when objects are added |
| objectsRemoved | ObjectsRemovedEvent | Emitted when objects are removed |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when objects are updated |
| objectsInViewportChange | KritzelBaseObject[] | Emitted when visible objects change (after pan/zoom) |
| objectsSelectionChange | void | Emitted when selected objects change |
| undoStateChange | KritzelUndoState | Emitted when undo/redo availability changes |
| viewportChange | KritzelViewportState | Emitted on pan, zoom, or resize |
| workspacesChange | KritzelWorkspace[] | Emitted when workspaces are created, updated, or deleted |

---

## Object

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectConfig | KritzelObjectConfig | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object. See [Object Configuration](../customization/object-config.md). |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### addObjects

Adds multiple objects in one undo step and render cycle.

```ts
addObjects<T extends KritzelBaseObject>(objects: T[]): Promise<T[]>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### removeObjects

Removes multiple objects in one batch operation.

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

#### panToObject

Pans to an object without changing scale.

```ts
panToObject(object: KritzelBaseObject): Promise<void>
```

#### zoomTo

Zooms the viewport to the given scale. Optionally centers on a world point; if omitted, zooms around the viewport center.

```ts
zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>
```

#### zoomIn

Zooms in by one configured step: `zoomIn(): Promise<void>`.

#### zoomOut

Zooms out by one configured step: `zoomOut(): Promise<void>`.

#### centerObjectInViewport

Pans and zooms the viewport to center on the given object.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject>
```

#### centerObjects

Centers the combined bounds of supplied objects: `centerObjects(objects: KritzelBaseObject[]): Promise<void>`.

#### centerAllObjects

Centers the combined bounds of all objects: `centerAllObjects(): Promise<void>`.

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
getWorkspaces: Promise<KritzelWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace: Promise<KritzelWorkspace>
```

#### getIsPublic

Returns whether the active workspace is public: `getIsPublic(): Promise<boolean>`.

#### loadSharedWorkspace

Loads a shared workspace: `loadSharedWorkspace(workspaceId: string): Promise<void>`.

#### reinitSync

Reinitializes the active synchronization provider: `reinitSync(): Promise<void>`.

---

## Tool Management

#### registerTool

Registers a new drawing tool with the engine.

```ts
registerTool(
  toolName: string,
  toolClass: any,
  toolConfig?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelTextToolConfig | KritzelShapeToolConfig
): Promise<KritzelBaseTool>
```

#### setActiveTool

Switches the active drawing tool. Deactivates the current tool and clears any selection.

```ts
setActiveTool(toolName: string): Promise<void>
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

#### copy

Copies the currently selected objects to the internal clipboard.

```ts
copy: Promise<void>
```

#### cut

Cuts selected objects to the clipboard.

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
delete: Promise<void>
```

---

## Ordering

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

#### alignObjects

Aligns the currently selected objects according to the specified alignment.

```ts
alignObjects(alignment: KritzelAlignment): Promise<void>
```

Alignment values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

---

## Grouping

#### group

Creates a group (`KritzelGroup`) from the given objects. Requires at least two objects. They become one layer at the position of the topmost object, in a single undoable step. Objects are resolved by id, so stale references work; objects that are not in the active workspace are skipped with a console warning. Objects inside a common group are grouped within it; objects from different groups are grouped at the level that contains all of them. Selected objects that end up in the group are replaced by the group in the selection. Resolves to the created group, or `null` (with a console warning) when fewer than two objects could be grouped. To group the current selection, pass `await getSelectedObjects()`.

```ts
group(objects: KritzelBaseObject[]): Promise<KritzelGroup | null>
```

#### ungroup

Ungroups the given groups. Their children become individual objects again and keep their stacking order; the children of a nested group stay in its parent group. All groups are dissolved in a single undoable step. Groups are resolved by id, so stale references work; entries that are not a `KritzelGroup` or not in the active workspace are skipped with a console warning. Dissolved groups in the selection are replaced by their children. Resolves to the extracted children. To ungroup the current selection, pass the `KritzelGroup` objects from `await getSelectedObjects()`.

```ts
ungroup(groups: KritzelGroup[]): Promise<KritzelBaseObject[]>
```

---

## Undo & Redo

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

## Export & Import

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

#### canExportSelectedObjectAs

Checks whether the selected object supports a format: `canExportSelectedObjectAs(format: KritzelExportFormat): Promise<boolean>`.

#### exportSelectedObject

Exports the selected object: `exportSelectedObject(format: KritzelExportFormat): Promise<void>`.

#### getSelectedObjectSupportedExportFormats

Returns supported selected-object formats: `getSelectedObjectSupportedExportFormats(): Promise<KritzelExportFormat[]>`.

#### exportAsJson

Serializes the current workspace: `exportAsJson(): Promise<string>`.

#### importFromJson

Imports a serialized workspace: `importFromJson(json: string): Promise<void>`.

#### loadObjectsFromJson

Loads serialized objects: `loadObjectsFromJson(json: string): Promise<number>`.

#### downloadAsJson

Downloads the current workspace: `downloadAsJson(filename?: string): Promise<void>`.

#### importFromFile

Opens a file picker and imports a workspace: `importFromFile(): Promise<void>`.

---

## Localization & Settings

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale code applied to the engine. |
| locales | KritzelLocale[] | Available locale definitions with optional term overrides. |
| theme | ThemeCode | Current theme applied to the engine. |
| themes | KritzelTheme[] | Available themes for the engine. |

### Methods

#### registerLocales

Registers locale definitions: `registerLocales(locales: KritzelLocale[]): Promise<void>`.

#### setLocale

Sets the active locale: `setLocale(code: LocaleCode): Promise<void>`.

#### getLocale

Returns the active locale: `getLocale(): Promise<LocaleCode>`.

#### getAvailableLocales

Returns available locale codes: `getAvailableLocales(): Promise<LocaleCode[]>`.

#### getAvailableLocaleOptions

Returns available code/label options: `getAvailableLocaleOptions(): Promise<{ code: LocaleCode; label: string }[]>`.

#### t

Resolves a localized term: `t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>`.

#### getResolvedTerms

Returns all resolved terms: `getResolvedTerms(): Promise<Partial<Record<KritzelTermKey, string>>>`.

#### saveSettings

Persists settings: `saveSettings(settings: KritzelSettingsConfig): Promise<void>`.

#### loadSettings

Loads persisted settings: `loadSettings(): Promise<Partial<KritzelSettingsConfig> | null>`.

## Context Menu & Lifecycle

### Props

| Property | Type | Description |
|----------|------|-------------|
| assetStorageConfig | KritzelAssetStorageConfig | Configuration for binary asset storage providers. |
| cursorTarget | HTMLElement | Element to apply cursor styles to. |
| debugInfo | KritzelDebugInfo | Controls visible debug overlays. |
| editorId | string | Identifier for namespacing storage keys across engine instances. |
| globalContextMenuItems | ContextMenuItem[] | Items shown on the canvas background context menu. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Kritzel" watermark (default `true`). Keeping it visible helps support the project. |
| lockDrawingScale | boolean | Keeps drawn objects at a fixed visual size across zoom levels. |
| objectContextMenuItems | ContextMenuItem[] | Items shown for selected objects. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| contextMenuStateChange | KritzelContextMenuState | Emitted when context-menu state changes. |
| isEngineReady | KritzelEngineState | Emitted when the engine is ready for interaction. |
| longpress | PointerEvent | Emitted on touch or pen long-press. |
| notificationsChange | KritzelNotification | Emitted when notifications change. |

### Methods

#### openContextMenu

Opens a context menu: `openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>`.

#### hideContextMenu

Hides the context menu: `hideContextMenu(): Promise<void>`.

#### getDisplayableShortcuts

Returns shortcuts without actions or conditions: `getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, "action" | "condition">[]>`.

#### beginSceneBootstrap

Starts scene bootstrap and hides the scene: `beginSceneBootstrap(): Promise<void>`.

#### endSceneBootstrap

Ends scene bootstrap: `endSceneBootstrap(): Promise<void>`.

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

---

## Object Titlebar

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectTitlebar | KritzelObjectTitlebarConfig | Content of the titlebar rendered above every object for which `objectConfig.hasTitlebar` is true. The same configuration applies to all objects. Leave unset to disable titlebars. See [Titlebars](../customization/titlebars.md). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectTitlebarAction | KritzelObjectTitlebarActionEvent | Emitted when a button in an object titlebar is clicked or a menu item of a titlebar menu is selected, in addition to calling the optional `action` callback of the button or menu item. |
| objectTitlebarMenuStateChange | KritzelObjectTitlebarMenuState | Emitted when a titlebar menu opens or closes. Contains the resolved menu items and the menu button as `anchor`, so that a host can render the menu. `<kritzel-editor>` renders titlebar menus itself and does not re-emit this event. |

### Methods

#### closeObjectTitlebarMenu

Closes the open titlebar menu, if any.

```ts
closeObjectTitlebarMenu(): Promise<void>
```

#### selectObjectTitlebarMenuItem

Selects a menu item of the open titlebar menu. Closes the menu, calls the menu item's `action`, and emits `objectTitlebarAction` with the `id` of the menu as `elementId` and `menuItemId`. Does nothing if no menu is open or the menu item is hidden or disabled.

```ts
selectObjectTitlebarMenuItem(menuItemId: string): Promise<void>
```

Use [updateObject](#updateobject) to change the `name` of an existing object.
