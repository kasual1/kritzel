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
| chatBoxChips | KritzelChatBoxChip[] | Chips shown above the chat box, e.g. the selected object or the element the next prompt refers to. Up to three share one row, the rest show as "+N more". The editor never changes them: pass a new array, for example when `chatChipRemove` fires. |
| chatBoxMode | 'collapsed' \| 'expanded' | Initial chat box mode. A collapsed chat box expands automatically when its text overflows one row. |
| cursorTarget | HTMLElement | Element used as the cursor target. |
| customSvgIcons | string | Custom SVG icon definitions. |
| globalContextMenuItems | ContextMenuItem[] | Canvas background menu items. |
| isChatBoxLoading | boolean | Shows the chat box progress ring and turns its send button into a stop button. |
| isChatBoxVisible | boolean | Shows the chat box instead of the toolbar. |
| isMoreMenuVisible | boolean | Controls More menu visibility. |
| isToolbarVisible | boolean | Controls toolbar visibility. |
| isUtilityPanelVisible | boolean | Controls utility panel visibility. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Kritzel" watermark (default `true`). Keeping it visible helps support the project. |
| isWorkspaceManagerVisible | boolean | Controls workspace manager visibility. |
| isZoomPanelVisible | boolean | Controls zoom panel visibility. |
| moreMenuItems | IKritzelMenuItem[] | Custom More menu entries. |
| objectContextMenuItems | ContextMenuItem[] | Selected-object menu items. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| chatChipRemove | KritzelChatBoxChip | Emitted with the chat box chip whose remove button the user activated. The chip stays until `chatBoxChips` no longer contains it. |
| chatStop | void | Emitted when the user stops the current chat response. |
| chatSubmit | string | Emitted with the chat box text when the user submits it. |

`KritzelChatBoxChip` describes one chip. Its texts are shown verbatim, they are not translated:

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique, stable identifier, e.g. the id of the referenced object. |
| label | string | Main text, shown bold, e.g. the referenced object's name. |
| detail | string (optional) | A narrower part of the label, shown after `›`, e.g. the element picked inside the object. |
| hint | string (optional) | Muted text after the label and detail, e.g. what the user can do next. |
| icon | KritzelIconName (optional) | Registered icon shown before the label, e.g. `'cursor'`. |

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

| Property | Type | Description |
|----------|------|-------------|
| objectConfig | KritzelObjectConfig | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object. See [Configuring Objects](../fundamentals/objects.md#configuring-objects). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectsAdded | ObjectsAddedEvent | Emitted when objects are added. `source` is set when an agent made the change. |
| objectsChange | KritzelBaseObject[] | Emitted when objects change. |
| objectsRemoved | ObjectsRemovedEvent | Emitted when objects are removed. `source` is set when an agent made the change. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when objects are updated. `source` is set when an agent made the change. |

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

## Agents

Agents are participants on the canvas that are driven by code, for example an AI assistant. Each agent is a [`KritzelAgent`](./agent.md) with its own cursor, actions, and undo history. See [Agents](../advanced/agents.md) for a guide. When the editor shares presence, collaborators see its agents, and it shows theirs; see [Collaboration](../advanced/agents.md#collaboration).

### Props

| Property | Type | Description |
|----------|------|-------------|
| isAgentAvatarsVisible | boolean | Whether the avatar stack shows the agents, those of this editor and those of collaborators, after the active users (default `true`). Each agent has a bot badge, a ring while it works, and its status in the tooltip. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| agentsChange | KritzelAgentsChangeEvent | Emitted when agents are added or removed, or when their name, color, avatar, status, visibility, or activity changes, in this editor or in the editor of a collaborator. Lists the agents of this editor first, then the agents of collaborators (`isRemote: true`). Never emitted for plain cursor motion. |

### Methods

#### addAgent

Adds an agent and shows its cursor. Adding the same agent again does nothing. An agent belongs to one editor at a time; an agent of an editor that was removed from the page moves here. Call it after the editor emitted `isReady`. Rejects for a value that is not a `KritzelAgent`, for a second agent with the same ID, and for an agent of another editor.

```ts
addAgent(agent: KritzelAgent): Promise<KritzelAgent>
```

#### removeAgent

Removes an agent, given the agent or its ID: its running action is rolled back, its queued actions resolve with `'agent-removed'`, and its cursor and history are dropped. The agent can be added again. Resolves with `false` if the agent was not added.

```ts
removeAgent(agent: KritzelAgent | string): Promise<boolean>
```

#### getAgent

Returns an agent added to this editor by its ID, or `null` if there is none. Agents of collaborators are never returned; see `getRemoteAgents`.

```ts
getAgent(id: string): Promise<KritzelAgent | null>
```

#### getAgents

Returns the agents added to this editor.

```ts
getAgents(): Promise<KritzelAgent[]>
```

#### getRemoteAgents

Returns the agents of collaborators, as they share them through presence. They are descriptions, not `KritzelAgent` objects, and cannot be controlled from here. Empty without a sync provider that shares presence. See [`KritzelRemoteAgentPresence`](./agent.md#kritzelremoteagentpresence).

```ts
getRemoteAgents(): Promise<KritzelRemoteAgentPresence[]>
```

---

## Object Titlebar

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectTitlebar | KritzelObjectTitlebarConfig | Content of the titlebar rendered above every object for which `objectConfig.hasTitlebar` is true. The same configuration applies to all objects. Leave unset to disable titlebars. See [Object Titlebar](../fundamentals/controls.md#object-titlebar). |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectTitlebarAction | KritzelObjectTitlebarActionEvent | Emitted when a button in an object titlebar is clicked or a menu item of a titlebar menu is selected, in addition to calling the optional `action` callback of the button or menu item. |

### Methods

No titlebar-specific methods. Titlebar menus are rendered by the editor itself. Use [updateObject](#updateobject) to change the `name` of an existing object.

---

## Object Elements

Elements inside the content of objects such as `KritzelIframeObject`. See [Interacting with iFrame Content](../advanced/dynamic-objects.md#interacting-with-iframe-content).

### Props

No object-element-specific props.

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| objectElementHover | KritzelObjectElementHoverEvent | Emitted when the mouse or pen pointer moves onto another element inside the content of a selected object, such as an iframe object, and with `element: null` when it leaves the content or the object is deselected. |
| objectElementClick | KritzelObjectElementClickEvent | Emitted when the user clicks an element inside the content of a selected object. The click works as usual. |
| objectElementPick | KritzelObjectElementPickEvent | Emitted when the user picks an element inside an object that is picking elements. The click doesn't reach the content. See [setObjectElementPicking](#setobjectelementpicking). |

### Methods

#### setObjectElementPicking

Turns element picking on or off for an object whose content has elements, such as an iframe object. While picking, the element under the pointer is highlighted, and a press or click emits `objectElementPick` instead of reaching the content. Picking works while the object is selected and stays on until it is turned off. `selector` limits picking to the closest matching ancestor of the element under the pointer, `color` sets the highlight color.

```ts
setObjectElementPicking(objectId: string, enabled: boolean, options?: KritzelObjectElementPickingOptions): Promise<void>
```

#### highlightObjectElements

Highlights elements inside an object's content, replacing the object's previous highlights. Each entry is `{ selector, color?, label? }`, and every element that matches its selector is highlighted, up to 100 per selector. Highlights are local: they are neither saved nor shown to collaborators.

```ts
highlightObjectElements(objectId: string, highlights: KritzelObjectElementHighlight[]): Promise<void>
```

#### clearObjectElementHighlights

Removes the element highlights of an object, or of all objects when `objectId` is omitted.

```ts
clearObjectElementHighlights(objectId?: string): Promise<void>
```

#### queryObjectElements

Describes the elements inside an object's content that match a CSS selector, in document order. Each result has a `selector` that can be used to highlight the element or point an agent's cursor at it (`agent.moveTo({ objectId, selector })`, see [KritzelAgenticTarget](./agent.md#kritzelagentictarget)). `limit` defaults to 100 and can be at most 500. The object must be mounted, which it is while it is in or near the viewport. Rejects when the content does not answer within 3 seconds, or within 15 seconds while it is still loading.

```ts
queryObjectElements(objectId: string, selector: string, limit?: number): Promise<KritzelObjectElementInfo[]>
```

All object element methods reject for invalid selectors and for objects that don't exist or have no content elements.
