---

sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor API Reference | Kritzel for Vue"
description: "Complete API reference for the Kritzel editor component: props, methods, and events available in Vue."
toc_max_heading_level: 2
---

# Editor

The `<KritzelEditor>` is the high-level, full-featured whiteboard component. It wraps `<KritzelEngine>` and adds a toolbar, utility panel, context menus, dialogs, and workspace management.

All methods are async and return Promises. The editor exposes all the same methods as the engine.

## General

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| scaleMax | number | ABSOLUTE_SCALE_MAX | Maximum zoom scale allowed |
| scaleMin | number | ABSOLUTE_SCALE_MIN | Minimum zoom scale allowed |
| lockDrawingScale | boolean | true | When true, objects are drawn at a fixed visual size regardless of zoom |
| viewportBoundaryLeft | number | -Infinity | Left boundary in world coordinates |
| viewportBoundaryRight | number | Infinity | Right boundary in world coordinates |
| viewportBoundaryTop | number | -Infinity | Top boundary in world coordinates |
| viewportBoundaryBottom | number | Infinity | Bottom boundary in world coordinates |
| toolbarItems | KritzelToolbarItem[] | Default toolbar | Toolbar items (selection, brush, line, eraser, text, shape, image, config) |
| globalContextMenuItems | ContextMenuItem[] | Paste, Select All | Context menu when right-clicking the canvas background |
| objectContextMenuItems | ContextMenuItem[] | Copy, Paste, Order, Align, Group, Delete | Context menu when right-clicking a selected object |
| customSvgIcons | Record&lt;string, string&gt; | {} | Custom SVG icon definitions by name |
| isToolbarVisible | boolean | true | Show/hide the toolbar |
| isUtilityPanelVisible | boolean | true | Show/hide the utility panel (undo/redo, zoom) |
| isWatermarkVisible | boolean | true | Show/hide the "Powered by Kritzel" watermark |
| syncConfig | KritzelSyncConfig | undefined | Sync provider configuration |
| workspaces | KritzelWorkspace[] | undefined | Optional authoritative workspace catalog for this editor instance. Provider-only workspaces are hidden but not deleted. |

### Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| isReady | HTMLElement | Emitted when the editor is fully initialized |
| objectsChange | KritzelBaseObject[] | Emitted when objects are added, removed, or modified |
| objectsAdded | ObjectsAddedEvent | Emitted when objects are added |
| objectsRemoved | ObjectsRemovedEvent | Emitted when objects are removed |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when objects are updated |
| undoStateChange | KritzelUndoState | Emitted when undo/redo availability changes |
| themeChange | ThemeName | Emitted when the theme changes |
| viewportChange | KritzelViewportState | Emitted on pan, zoom, or resize |

---

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
| cursorTarget | HTMLElement | Element used as cursor target. Defaults to the editor container if omitted. |
| customSvgIcons | KritzelSvgIconMap | Custom SVG icon definitions. |
| globalContextMenuItems | ContextMenuItem[] | Context menu items shown on the canvas background. |
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

Opens a context menu at screen coordinates: `openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>`.

#### openWorkspaceManagerMenu

Opens the workspace manager menu: `openWorkspaceManagerMenu(): Promise<void>`.

#### openMoreMenu

Opens the More menu: `openMoreMenu(): Promise<void>`.

#### hideContextMenu

Hides the active context menu: `hideContextMenu(): Promise<void>`.

#### getDisplayableShortcuts

Returns registered shortcuts without their actions or conditions: `getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, "action" | "condition">[]>`.

#### triggerNotification

Shows a UI notification: `triggerNotification(notification: Omit<KritzelNotification, "id"> & Partial<Pick<KritzelNotification, "id" | "timestamp">>): Promise<void>`.

## Object

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectConfig | KritzelObjectConfig | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object. See [Configuring Objects](../fundamentals/objects.md#configuring-objects). |

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

Zooms in by one configured step.

```ts
zoomIn(): Promise<void>
```

#### zoomOut

Zooms out by one configured step.

```ts
zoomOut(): Promise<void>
```

#### centerObjectInViewport

Pans and zooms the viewport to center on the given object.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject>
```

#### centerObjects

Moves the supplied objects so their combined bounds are centered in the viewport.

```ts
centerObjects(objects: KritzelBaseObject[]): Promise<void>
```

#### centerAllObjects

Moves all objects so their combined bounds are centered in the viewport.

```ts
centerAllObjects(): Promise<void>
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
getWorkspaces: Promise<KritzelWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace: Promise<KritzelWorkspace>
```

#### loadSharedWorkspace

Loads a shared workspace by identifier.

```ts
loadSharedWorkspace(workspaceId: string): Promise<void>
```

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

Creates a group (`KritzelGroup`) from the given objects. Requires at least two objects. They become one layer at the position of the topmost object, in a single undoable step. Resolves to the created group, or `null` when fewer than two objects could be grouped. To group the current selection, pass `await getSelectedObjects()`. See the engine's `group` for details.

```ts
group(objects: KritzelBaseObject[]): Promise<KritzelGroup | null>
```

#### ungroup

Ungroups the given groups. Their children become individual objects again and keep their stacking order, in a single undoable step. Resolves to the extracted children. To ungroup the current selection, pass the `KritzelGroup` objects from `await getSelectedObjects()`. See the engine's `ungroup` for details.

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

Checks whether the selected object supports a format.

```ts
canExportSelectedObjectAs(format: KritzelExportFormat): Promise<boolean>
```

#### exportSelectedObject

Exports the selected object in the requested format.

```ts
exportSelectedObject(format: KritzelExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

Returns export formats supported by the selected object.

```ts
getSelectedObjectSupportedExportFormats(): Promise<KritzelExportFormat[]>
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

## Localization

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale code used by the editor. |
| locales | KritzelLocale[] | Available locale definitions with optional term overrides. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| localeChange | LocaleCode | Emitted when the active locale changes. |

### Methods

#### registerLocales

Registers locale definitions: `registerLocales(locales: KritzelLocale[]): Promise<void>`.

#### getAvailableLocales

Returns available locale codes: `getAvailableLocales(): Promise<LocaleCode[]>`.

#### getLocale

Returns the active locale: `getLocale(): Promise<LocaleCode>`.

#### setLocale

Sets the active locale: `setLocale(code: LocaleCode): Promise<void>`.

#### t

Resolves a localized term: `t(key: KritzelTermKey, vars?: KritzelTermVars): Promise<string>`.

## User Management

### Props

| Property | Type | Description |
|----------|------|-------------|
| user | IKritzelUser | Current authenticated user for awareness and collaboration state. |
| loginConfig | KritzelLoginConfig | Login dialog provider configuration. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| login | LoginEvent | Emitted when login is triggered from the authentication dialog. |
| logout | void | Emitted when logout is triggered from the editor UI. |

### Methods

#### openLoginDialog

Opens the configured login dialog: `openLoginDialog(): Promise<void>`.

#### setLoginLoading

Sets a provider's loading state: `setLoginLoading(provider: string | null): Promise<void>`.

## Collaboration

### Props

| Property | Type | Description |
|----------|------|-------------|
| activeUsers | IKritzelUser[] | Other users currently in the session. |
| syncConfig | KritzelSyncConfig | Real-time collaboration provider configuration. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| awarenessChange | AwarenessStateMap | Emitted when collaborative awareness state changes. |

### Methods

#### reinitSync

Reinitializes the active synchronization provider connection.

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

---

## Object Titlebar

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectTitlebar | KritzelObjectTitlebarConfig | Content of the titlebar rendered above every object for which `objectConfig.hasTitlebar` is true. The same configuration applies to all objects. Leave unset to disable titlebars. See [Titlebar](../fundamentals/controls.md#titlebar). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectTitlebarAction | KritzelObjectTitlebarActionEvent | Emitted when a button in an object titlebar is clicked or a menu item of a titlebar menu is selected, in addition to calling the optional `action` callback of the button or menu item. |

### Methods

No titlebar-specific methods. Titlebar menus are rendered by the editor itself. Use [updateObject](#updateobject) to change the `name` of an existing object.
