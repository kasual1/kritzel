---

sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine API Reference | Updraw for React"
description: "Complete API reference for the headless Updraw engine: rendering, viewport, pointer events, and workspace management."
toc_max_heading_level: 2
---

# Engine

The `<UpdrawEngine>` is the low-level headless canvas primitive. It handles rendering, viewport management, pointer events, undo/redo, and workspace management with no built-in controls.

## Object

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectConfig | UpdrawObjectConfig | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object. See [Configuring Objects](../fundamentals/objects.md#configuring-objects). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectsAdded | ObjectsAddedEvent | Emitted when one or more objects are added to the canvas. `source` is set when an agent made the change. |
| objectsChange | UpdrawBaseObject[] | Emitted when objects on the canvas are added, removed, or modified. |
| objectsRemoved | ObjectsRemovedEvent | Emitted when one or more objects are removed from the canvas. `source` is set when an agent made the change. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when one or more objects are updated on the canvas. `source` is set when an agent made the change. |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends UpdrawBaseObject>(object: T): Promise<T | null>
```

#### addObjects

Adds multiple objects to the canvas in a single batch operation within one undo step and render cycle.

```ts
addObjects<T extends UpdrawBaseObject>(objects: T[]): Promise<T[]>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends UpdrawBaseObject>(object: T): Promise<T | null>
```

#### removeObjects

Removes multiple objects from the canvas in a single batch operation.

```ts
removeObjects<T extends UpdrawBaseObject>(objects: T[]): Promise<T[]>
```

#### updateObject

Updates properties of an existing canvas object.

```ts
updateObject<T extends UpdrawBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T | null>
```

#### getObjectById

Retrieves a canvas object by its unique ID.

```ts
getObjectById<T extends UpdrawBaseObject>(id: string): Promise<T | null>
```

#### getAllObjects

Returns all objects on the canvas across all layers.

```ts
getAllObjects<T extends UpdrawBaseObject>(): Promise<T[]>
```

#### findObjects

Returns all objects matching the given predicate. Excludes internal selection-related objects.

```ts
findObjects<T extends UpdrawBaseObject>(predicate: (obj: UpdrawBaseObject) => boolean): Promise<T[]>
```

#### getObjectsTotalCount

Returns the total number of objects on the canvas.

```ts
getObjectsTotalCount(): Promise<number>
```

#### getObjectsInViewport

Returns all objects currently visible within the viewport bounds.

```ts
getObjectsInViewport(): Promise<UpdrawBaseObject[]>
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
getSelectedObjects(): Promise<UpdrawBaseObject[]>
```

#### selectObjects

Programmatically selects the given objects. Switches to the selection tool automatically.

```ts
selectObjects(objects: UpdrawBaseObject[]): Promise<void>
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
| viewportChange | UpdrawViewportState | Emitted on viewport pan, zoom, or resize. |
| objectsInViewportChange | UpdrawBaseObject[] | Emitted when the set of objects visible in the current viewport changes. |

### Methods

#### getViewport

Returns the current viewport state including position, scale, and dimensions.

```ts
getViewport(): Promise<UpdrawViewportState>
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
panToObject(object: UpdrawBaseObject): Promise<void>
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
centerObjectInViewport(object: UpdrawBaseObject): Promise<UpdrawBaseObject>
```

#### centerObjects

Pans and zooms the viewport to fit the provided objects.

```ts
centerObjects(objects: UpdrawBaseObject[], animate?: boolean): Promise<boolean>
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
| workspaces | UpdrawWorkspace[] | Optional authoritative workspace catalog for this engine instance. |
| syncConfig | UpdrawSyncConfig | Configuration for synchronization providers. |
| user | IUpdrawUser | Current user for awareness broadcasting. |
| isLoading | boolean | External loading state merged with internal workspace loading state. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| activeWorkspaceChange | UpdrawWorkspace | Emitted when the active workspace changes. |
| workspacesChange | UpdrawWorkspace[] | Emitted when workspaces are created, updated, or deleted. |
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

Creates a new workspace and emits a `workspacesChange` event. Accepts an `UpdrawWorkspace` instance.

```ts
createWorkspace(workspace: UpdrawWorkspace): Promise<UpdrawWorkspace | null>
```

#### updateWorkspace

Applies a workspace as declared and emits a `workspacesChange` event. Metadata and viewport are always applied. When `workspace.objects` is set it is treated as the complete desired object set: objects are matched by ID, unknown IDs are added, known IDs are updated, and objects missing from the list are removed. Leave `objects` `undefined` to keep the current objects, or pass `[]` to remove them all. Updating the objects of a workspace that is not currently active requires a configured sync provider.

```ts
updateWorkspace(workspace: UpdrawWorkspace): Promise<void>
```

#### deleteWorkspace

Deletes a workspace and emits a `workspacesChange` event.

```ts
deleteWorkspace(workspace: UpdrawWorkspace): Promise<void>
```

#### getWorkspaces

Returns all available workspaces.

```ts
getWorkspaces(): Promise<UpdrawWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace(): Promise<UpdrawWorkspace>
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
| activeToolChange | UpdrawBaseTool | Emitted when the active drawing tool changes. |

### Methods

#### registerTool

Registers a new drawing tool with the engine.

```ts
registerTool(
  toolName: string,
  toolClass: any,
  toolConfig?: UpdrawBrushToolConfig | UpdrawLineToolConfig | UpdrawTextToolConfig | UpdrawShapeToolConfig
): Promise<UpdrawBaseTool | null>
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
bringForward(object?: UpdrawBaseObject): Promise<void>
```

#### sendBackward

Moves an object one layer backward in the z-order, past the next layer below it. If omitted, applies to the current selection and moves each selected layer. A group is one layer, so all of its children move together; a grouped object moves within its group.

```ts
sendBackward(object?: UpdrawBaseObject): Promise<void>
```

#### bringToFront

Moves an object to the very front of the z-order. If omitted, applies to the current selection, keeping the relative order of the selected layers. A group moves together with all of its children; a grouped object moves to the front of its group.

```ts
bringToFront(object?: UpdrawBaseObject): Promise<void>
```

#### sendToBack

Moves an object to the very back of the z-order. If omitted, applies to the current selection, keeping the relative order of the selected layers. A group moves together with all of its children; a grouped object moves to the back of its group.

```ts
sendToBack(object?: UpdrawBaseObject): Promise<void>
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
alignObjects(alignment: UpdrawAlignment): Promise<void>
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

Creates a group (`UpdrawGroup`) from the given objects. Requires at least two objects. They become one layer at the position of the topmost object, in a single undoable step. Objects are resolved by id, so stale references work; objects that are not in the active workspace are skipped with a console warning. Objects inside a common group are grouped within it; objects from different groups are grouped at the level that contains all of them. Selected objects that end up in the group are replaced by the group in the selection. Resolves to the created group, or `null` (with a console warning) when fewer than two objects could be grouped. To group the current selection, pass `await getSelectedObjects()`.

```ts
group(objects: UpdrawBaseObject[]): Promise<UpdrawGroup | null>
```

#### ungroup

Ungroups the given groups. Their children become individual objects again and keep their stacking order; the children of a nested group stay in its parent group. All groups are dissolved in a single undoable step. Groups are resolved by id, so stale references work; entries that are not an `UpdrawGroup` or not in the active workspace are skipped with a console warning. Dissolved groups in the selection are replaced by their children. Resolves to the extracted children. To ungroup the current selection, pass the `UpdrawGroup` objects from `await getSelectedObjects()`.

```ts
ungroup(groups: UpdrawGroup[]): Promise<UpdrawBaseObject[]>
```

---

## Undo & Redo

### Props

No undo/redo-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| undoStateChange | UpdrawUndoState | Emitted when undo/redo availability changes. |

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
canExportSelectedObjectAs(format: UpdrawObjectExportFormat): Promise<boolean>
```

#### exportSelectedObject

Exports the currently selected object in the specified format.

```ts
exportSelectedObject(format: UpdrawObjectExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

Returns the export formats supported by the currently selected object.

```ts
getSelectedObjectSupportedExportFormats(): Promise<UpdrawObjectExportFormat[]>
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
| locales | UpdrawLocale[] | Available locale definitions. |
| theme | ThemeCode | Current theme. |
| themes | UpdrawTheme[] | Available themes. |

### Events

No localization/settings-specific events.

### Methods

#### registerLocales

```ts
registerLocales(locales: UpdrawLocale[]): Promise<void>
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
t(key: UpdrawTermKey, vars?: UpdrawTermVars): Promise<string>
```

#### getResolvedTerms

```ts
getResolvedTerms(): Promise<Partial<Record<UpdrawTermKey, string>>>
```

#### saveSettings

```ts
saveSettings(settings: UpdrawSettingsConfig): Promise<void>
```

#### loadSettings

```ts
loadSettings(): Promise<Partial<UpdrawSettingsConfig> | null>
```

---

## Context Menu & Lifecycle

### Props

| Property | Type | Description |
|----------|------|-------------|
| assetStorageConfig | UpdrawAssetStorageConfig | Binary asset storage provider configuration. |
| cursorTarget | HTMLElement | Element to apply cursor styles to. |
| debugInfo | UpdrawDebugInfo | Debug overlay configuration. |
| editorId | string | Identifier for namespacing storage keys. |
| globalContextMenuItems | ContextMenuItem[] | Canvas background menu items. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Updraw" watermark (default `true`). Keeping it visible helps support the project. |
| lockDrawingScale | boolean | Keeps objects at a fixed visual size across zoom. |
| objectContextMenuItems | ContextMenuItem[] | Selected-object menu items. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| contextMenuStateChange | UpdrawContextMenuState | Emitted when context-menu state changes. |
| isEngineReady | UpdrawEngineState | Emitted when the engine is ready. |
| longpress | PointerEvent | Emitted on touch or pen long-press. |
| notificationsChange | UpdrawNotification | Emitted when notifications change. |

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
getDisplayableShortcuts(): Promise<Omit<UpdrawShortcut, "action" | "condition">[]>
```

#### beginSceneBootstrap

```ts
beginSceneBootstrap(): Promise<void>
```

#### endSceneBootstrap

```ts
endSceneBootstrap(): Promise<void>
```

## Agents

Agents are participants on the canvas that are driven by code, for example an AI assistant. Each agent is a [`UpdrawAgent`](./agent.md) with its own cursor, actions, and undo history. See [Agents](../advanced/agents.md) for a guide. When the editor shares presence, collaborators see its agents, and it shows theirs; see [Collaboration](../advanced/agents.md#collaboration).

### Props

| Property | Type | Description |
|----------|------|-------------|
| chatSession | UpdrawChatSession | A [chat session](./chat-session.md) whose tools act on this canvas. Its agent, if any, is added here. A session that is replaced finishes its running prompt first. See [Agents](../advanced/agents.md). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| agentsChange | UpdrawAgentsChangeEvent | Emitted when agents are added or removed, or when their name, color, avatar, status, visibility, or activity changes, in this editor or in the editor of a collaborator. Lists the agents of this editor first, then the agents of collaborators (`isRemote: true`). Never emitted for plain cursor motion. |

### Methods

#### addAgent

Adds an agent and shows its cursor. Adding the same agent again does nothing. An agent belongs to one editor at a time; an agent of an editor that was removed from the page moves here. Call it after the engine emitted `isEngineReady`. Rejects for a value that is not an `UpdrawAgent`, for a second agent with the same ID, and for an agent of another editor.

```ts
addAgent(agent: UpdrawAgent): Promise<UpdrawAgent>
```

#### removeAgent

Removes an agent, given the agent or its ID: its running action is rolled back, its queued actions resolve with `'agent-removed'`, and its cursor and history are dropped. The agent can be added again. Resolves with `false` if the agent was not added.

```ts
removeAgent(agent: UpdrawAgent | string): Promise<boolean>
```

#### getAgent

Returns an agent added to this editor by its ID, or `null` if there is none. Agents of collaborators are never returned; see `getRemoteAgents`.

```ts
getAgent(id: string): Promise<UpdrawAgent | null>
```

#### getAgents

Returns the agents added to this editor.

```ts
getAgents(): Promise<UpdrawAgent[]>
```

#### getRemoteAgents

Returns the agents of collaborators, as they share them through presence. They are descriptions, not `UpdrawAgent` objects, and cannot be controlled from here. Empty without a sync provider that shares presence. See [`UpdrawRemoteAgentPresence`](./agent.md#updrawremoteagentpresence).

```ts
getRemoteAgents(): Promise<UpdrawRemoteAgentPresence[]>
```

---

## Object Titlebar

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectTitlebar | UpdrawObjectTitlebarConfig | Content of the titlebar rendered above every object for which `objectConfig.hasTitlebar` is true. The same configuration applies to all objects. Leave unset to disable titlebars. See [Object Titlebar](../fundamentals/controls.md#object-titlebar). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectTitlebarAction | UpdrawObjectTitlebarActionEvent | Emitted when a button in an object titlebar is clicked or a menu item of a titlebar menu is selected, in addition to calling the optional `action` callback of the button or menu item. |
| objectTitlebarMenuStateChange | UpdrawObjectTitlebarMenuState | Emitted when a titlebar menu opens or closes. Contains the resolved menu items and the menu button as `anchor`, so that a host can render the menu. `<UpdrawEditor>` renders titlebar menus itself and does not re-emit this event. |

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

---

## Object Elements

Elements inside the content of objects such as `UpdrawIframeObject`. See [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content).

### Props

No object-element-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectElementHover | UpdrawObjectElementHoverEvent | Emitted when the mouse or pen pointer moves onto another element inside the content of a selected object, such as an iframe object, and with `element: null` when it leaves the content or the object is deselected. |
| objectElementClick | UpdrawObjectElementClickEvent | Emitted when the user clicks an element inside the content of a selected object. The click works as usual. |
| objectElementPick | UpdrawObjectElementPickEvent | Emitted when the user picks an element inside an object that is picking elements. The click doesn't reach the content. See [setObjectElementPicking](#setobjectelementpicking). |

### Methods

#### setObjectElementPicking

Turns element picking on or off for an object whose content has elements, such as an iframe object. While picking, the element under the pointer is highlighted, and a press or click emits `objectElementPick` instead of reaching the content. Picking works while the object is selected and stays on until it is turned off. `selector` limits picking to the closest matching ancestor of the element under the pointer, `color` sets the highlight color.

```ts
setObjectElementPicking(objectId: string, enabled: boolean, options?: UpdrawObjectElementPickingOptions): Promise<void>
```

#### highlightObjectElements

Highlights elements inside an object's content, replacing the object's previous highlights. Each entry is `{ selector, color?, label? }`, and every element that matches its selector is highlighted, up to 100 per selector. Highlights are local: they are neither saved nor shown to collaborators.

```ts
highlightObjectElements(objectId: string, highlights: UpdrawObjectElementHighlight[]): Promise<void>
```

#### clearObjectElementHighlights

Removes the element highlights of an object, or of all objects when `objectId` is omitted.

```ts
clearObjectElementHighlights(objectId?: string): Promise<void>
```

#### queryObjectElements

Describes the elements inside an object's content that match a CSS selector, in document order. Each result has a `selector` that can be used to highlight the element or point an agent's cursor at it (`agent.moveTo({ objectId, selector })`, see [UpdrawAgenticTarget](./agent.md#updrawagentictarget)). `limit` defaults to 100 and can be at most 500. The object must be mounted, which it is while it is in or near the viewport. Rejects when the content does not answer within 3 seconds, or within 15 seconds while it is still loading.

```ts
queryObjectElements(objectId: string, selector: string, limit?: number): Promise<UpdrawObjectElementInfo[]>
```

All object element methods reject for invalid selectors and for objects that don't exist or have no content elements.
