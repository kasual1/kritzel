---
sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor API Reference | Kritzel for Angular"
description: "Complete API reference for the Kritzel editor component: props, methods, and events available in Angular."
---

# Editor

The `<kritzel-editor>` is the high-level, full-featured whiteboard component. It wraps `<kritzel-engine>` and adds a toolbar, utility panel, context menus, dialogs, and workspace management.

## Props

| Property | Type | Description |
|----------|------|-------------|
| `activeUsers` | `IKritzelUser[]` | Other users currently in the session. |
| `activeWorkspaceId` | `string` | Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID. |
| `assetStorageConfig` | `KritzelAssetStorageConfig` | Asset storage configuration for images and binary data. |
| `toolbar` | `KritzelToolbarItem[]` | Toolbar items and tool configuration. |
| `cursorTarget` | `HTMLElement` | Element to apply cursor styles to. Defaults to editor container. |
| `customFonts` | `{ [x: string]: KritzelFontRegistration; }` | Registers custom fonts for object rendering and text tool. |
| `customSvgIcons` | `string` | Custom SVG icon definitions. |
| `debugInfo` | `KritzelDebugInfo` | Debug overlay configuration options. |
| `editorId` | `string` | Optional unique identifier for namespacing storage keys across multiple editor instances. |
| `fallbackLocale` | `"de" | "en" | "fr" | string & {}` | The locale used to resolve terms missing from the active locale. |
| `globalContextMenuItems` | `ContextMenuItem[]` | Context menu items for canvas background. |
| `isToolbarVisible` | `boolean` | Show or hide the toolbar. |
| `isLoading` | `boolean` | External loading state. When true, a loading overlay is displayed. |
| `isMoreMenuVisible` | `boolean` | Show or hide the 'More' menu. |
| `isObjectDistanceFadingActive` | `boolean` | When true, objects fade based on distance to the viewport center. |
| `isPanningEnabled` | `boolean` | Enable or disable viewport panning via regular wheel input. |
| `isUtilityPanelVisible` | `boolean` | Show or hide the utility panel (undo/redo, zoom). |
| `isWorkspaceManagerVisible` | `boolean` | Show or hide the workspace manager toggle. |
| `isZoomPanelVisible` | `boolean` | Show or hide the zoom control panel. |
| `isZoomingEnabled` | `boolean` | Enable or disable viewport zooming via Ctrl+wheel. |
| `licenseKey` | `string` | License key that, when valid, removes the "Powered by Kritzel" watermark. |
| `locale` | `"de" | "en" | "fr" | string & {}` | Current active locale code (e.g. 'en', 'de', 'fr'). |
| `locales` | `KritzelLocale[]` | Array of available locale definitions (with optional partial term overrides). |
| `lockDrawingScale` | `boolean` | When true, objects are drawn at a fixed visual size regardless of zoom. |
| `loginConfig` | `KritzelLoginConfig` | Optional login configuration for provider-based authentication dialog. |
| `moreMenuItems` | `IKritzelMenuItem&lt;any&gt;[]` | Custom menu items for the 'More' dropdown menu. |
| `objectContextMenuItems` | `ContextMenuItem[]` | Context menu items for selected objects. |
| `scaleMax` | `number` | Maximum zoom scale allowed. |
| `scaleMin` | `number` | Minimum zoom scale allowed. |
| `syncConfig` | `KritzelSyncConfig` | Real-time collaboration sync provider configuration. |
| `theme` | `"dark" | "light" | string & {}` | Current active theme. |
| `themes` | `KritzelTheme[]` | Array of available themes. |
| `user` | `IKritzelUser` | The current authenticated user for awareness broadcasting. |
| `viewportBoundaryBottom` | `number` | Bottom pan boundary in world coordinates. |
| `viewportBoundaryLeft` | `number` | Left pan boundary in world coordinates. |
| `viewportBoundaryRight` | `number` | Right pan boundary in world coordinates. |
| `viewportBoundaryTop` | `number` | Top pan boundary in world coordinates. |

## Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| `activeWorkspaceChange` | `ActiveWorkspaceChangeEvent` | Emitted when the active workspace changes. |
| `awarenessChange` | `Map<number, Record<string, any>>` | Emitted when collaborative awareness states change. |
| `isPublicChange` | `IKritzelIsPublicChangedEvent` | Emitted when the workspace public sharing status toggles. |
| `isReady` | `EditorIsReadyEvent` | Emitted when the editor is fully initialized and ready. |
| `localeChange` | `"de" | "en" | "fr" | string & {}` | Emitted when the active locale changes. |
| `login` | `LoginEvent` | Emitted when login is triggered via the provider dialog. |
| `logout` | `void` | Emitted when the user logs out via the menu. |
| `objectsAdded` | `ObjectsAddedEvent` | Emitted when one or more objects are added to the canvas. |
| `objectsChange` | `KritzelBaseObject&lt;HTMLElement | SVGElement&gt;[]` | Emitted when objects on the canvas are added, removed, or modified. |
| `objectsRemoved` | `ObjectsRemovedEvent` | Emitted when one or more objects are removed from the canvas. |
| `objectsUpdated` | `ObjectsUpdatedEvent` | Emitted when one or more objects are updated on the canvas. |
| `themeChange` | `"dark" | "light" | string & {}` | Emitted when the editor theme changes. |
| `undoStateChange` | `KritzelUndoState` | Emitted when undo/redo availability changes. |
| `viewportChange` | `KritzelViewportState` | Emitted on viewport pan, zoom, or resize. |

---

## Methods

All methods are async and return Promises.

### Object

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

### Selection

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

### Viewport & Navigation

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

Pans and zooms the viewport to center on the given object.

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

### Workspace

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

#### reinitSync

Reinitializes the active synchronization provider connection.

```ts
reinitSync(): Promise<void>
```

---

### Tool Management

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

Switches the active drawing tool. Deactivates the current tool and clears any selection.

```ts
changeActiveTool(tool: KritzelBaseTool): Promise<void>
```

#### changeActiveToolByName

Switches the active drawing tool by its registered name.

```ts
changeActiveToolByName(toolName: string): Promise<void>
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

### Clipboard & Editing

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

### Ordering

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

### Alignment

#### alignObjects

Aligns the currently selected objects according to the specified alignment.

```ts
alignObjects(alignment: KritzelAlignment): Promise<void>
```

Alignment values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

---

### Grouping

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

### Undo & Redo

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

### Export & Import

#### getScreenshot

Captures a screenshot of the current viewport as a data URL or blob.

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

### Fonts & Localization

#### registerFonts

Registers custom fonts for runtime rendering and text-tool usage.

```ts
registerFonts(fonts: KritzelFontMap): Promise<void>
```

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

### External Services & Dialogs

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

### UI & Lifecycle

#### openContextMenu

Opens a context menu programmatically at the given screen coordinates.

```ts
openContextMenu(options: { x: number; y: number; objectId?: string }): Promise<void>
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
