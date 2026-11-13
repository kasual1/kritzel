---

sidebar_label: Editor
displayed_sidebar: tutorialSidebar
title: "Editor API Reference | Updraw for Vue"
description: "Complete API reference for the Updraw editor component: props, methods, and events available in Vue."
toc_max_heading_level: 2
---

# Editor

The `<UpdrawEditor>` is the high-level, full-featured whiteboard component. It wraps `<UpdrawEngine>` and adds a toolbar, utility panel, context menus, dialogs, and workspace management.

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
| toolbarItems | UpdrawToolbarItem[] | Default toolbar | Toolbar items (selection, brush, line, eraser, text, shape, image, config) |
| globalContextMenuItems | ContextMenuItem[] | Paste, Select All | Context menu when right-clicking the canvas background |
| objectContextMenuItems | ContextMenuItem[] | Copy, Paste, Order, Align, Group, Delete | Context menu when right-clicking a selected object |
| customSvgIcons | Record&lt;string, string&gt; | {} | Custom SVG icon definitions by name |
| isToolbarVisible | boolean | true | Show/hide the toolbar |
| isUtilityPanelVisible | boolean | true | Show/hide the utility panel (undo/redo, zoom) |
| isWatermarkVisible | boolean | true | Show/hide the "Powered by Updraw" watermark |
| syncConfig | UpdrawSyncConfig | undefined | Sync provider configuration |
| workspaces | UpdrawWorkspace[] | undefined | Optional authoritative workspace catalog for this editor instance. Provider-only workspaces are hidden but not deleted. |

### Events

| Event | Payload Type | Description |
|-------|-------------|-------------|
| isReady | HTMLElement | Emitted when the editor is fully initialized |
| objectsChange | UpdrawBaseObject[] | Emitted when objects are added, removed, or modified |
| objectsAdded | ObjectsAddedEvent | Emitted when objects are added. `source` is set when an agent made the change. |
| objectsRemoved | ObjectsRemovedEvent | Emitted when objects are removed. `source` is set when an agent made the change. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when objects are updated. `source` is set when an agent made the change. |
| undoStateChange | UpdrawUndoState | Emitted when undo/redo availability changes |
| themeChange | ThemeName | Emitted when the theme changes |
| viewportChange | UpdrawViewportState | Emitted on pan, zoom, or resize |

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
| chatBoxChips | UpdrawChatBoxChip[] | Chips shown above the chat box, e.g. the selected object or the element the next prompt refers to. Up to three share one row, the rest show as "+N more". The editor never changes them: pass a new array, for example when `chatChipRemove` fires. |
| chatSession | UpdrawChatSession | A [chat session](./chat-session.md) the chat box sends its prompts to, with `chatBoxChips` as what they refer to. While it runs, the chat box shows its progress and its stop button stops it. |
| chatBoxMode | 'collapsed' \| 'expanded' | Initial chat box mode. A collapsed chat box expands automatically when its text overflows one row. |
| cursorTarget | HTMLElement | Element used as cursor target. Defaults to the editor container if omitted. |
| customSvgIcons | UpdrawSvgIconMap | Custom SVG icon definitions. |
| globalContextMenuItems | ContextMenuItem[] | Context menu items shown on the canvas background. |
| isChatBoxLoading | boolean | Shows the chat box progress ring and turns its send button into a stop button. A bound `chatSession` does this by itself while it runs. |
| isChatBoxVisible | boolean | Shows the chat box instead of the toolbar. |
| isMoreMenuVisible | boolean | Controls visibility of the More menu. |
| isToolbarVisible | boolean | Controls toolbar visibility. |
| isUtilityPanelVisible | boolean | Controls utility panel visibility. |
| isWatermarkVisible | boolean | Show or hide the "Powered by Updraw" watermark (default `true`). Keeping it visible helps support the project. |
| isWorkspaceManagerVisible | boolean | Controls workspace manager visibility. |
| isZoomPanelVisible | boolean | Controls zoom panel visibility. |
| moreMenuItems | IUpdrawMenuItem[] | Custom entries for the More dropdown menu. |
| objectContextMenuItems | ContextMenuItem[] | Context menu items shown for selected objects. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| chatChipRemove | UpdrawChatBoxChip | Emitted with the chat box chip whose remove button the user activated. The chip stays until `chatBoxChips` no longer contains it. |
| chatStop | void | Emitted when the user stops the current chat response. A bound `chatSession` is stopped too. |
| chatSubmit | string | Emitted with the chat box text when the user submits it. With a `chatSession`, the prompt is sent to it unless a listener calls `preventDefault()`. While a response runs, Enter keeps the text in the box. |

`UpdrawChatBoxChip` describes one chip. Its texts are shown verbatim, they are not translated:

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique, stable identifier, e.g. the id of the referenced object. |
| label | string | Main text, shown bold, e.g. the referenced object's name. |
| detail | string (optional) | A narrower part of the label, shown after `›`, e.g. the element picked inside the object. |
| hint | string (optional) | Muted text after the label and detail, e.g. what the user can do next. |
| icon | UpdrawIconName (optional) | Registered icon shown before the label, e.g. `'cursor'`. |
| objectId | string (optional) | The object the chip refers to. A chat session tells the model about it. Not shown. |
| selector | string (optional) | CSS selector of the element inside the object the chip refers to. A chat session tells the model about it. Not shown. |

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

Returns registered shortcuts without their actions or conditions: `getDisplayableShortcuts(): Promise<Omit<UpdrawShortcut, "action" | "condition">[]>`.

#### triggerNotification

Shows a UI notification: `triggerNotification(notification: Omit<UpdrawNotification, "id"> & Partial<Pick<UpdrawNotification, "id" | "timestamp">>): Promise<void>`.

## Object

### Props

| Property | Type | Description |
|----------|------|-------------|
| objectConfig | UpdrawObjectConfig | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object. See [Configuring Objects](../fundamentals/objects.md#configuring-objects). |

### Methods

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index. It plays the theme's appear animation, see [Object Appear](./theming.md#object-appear).

```ts
addObject<T extends UpdrawBaseObject>(object: T): Promise<T | null>
```

#### addObjects

Adds multiple objects in one undo step and render cycle. The objects appear one after another, in their order.

```ts
addObjects<T extends UpdrawBaseObject>(objects: T[]): Promise<T[]>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends UpdrawBaseObject>(object: T): Promise<T | null>
```

#### removeObjects

Removes multiple objects in one batch operation.

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
getAllObjects<T extends UpdrawBaseObject>: Promise<T[]>
```

#### findObjects

Returns all objects matching the given predicate. Excludes internal selection-related objects.

```ts
findObjects<T extends UpdrawBaseObject>(predicate: (obj: UpdrawBaseObject) => boolean): Promise<T[]>
```

#### getObjectsTotalCount

Returns the total number of objects on the canvas.

```ts
getObjectsTotalCount: Promise<number>
```

#### getObjectsInViewport

Returns all objects currently visible within the viewport bounds.

```ts
getObjectsInViewport: Promise<UpdrawBaseObject[]>
```

---

## Selection

#### getSelectedObjects

Returns the currently selected objects. Returns an empty array if nothing is selected.

```ts
getSelectedObjects: Promise<UpdrawBaseObject[]>
```

#### selectObjects

Programmatically selects the given objects. Switches to the selection tool automatically.

```ts
selectObjects(objects: UpdrawBaseObject[]): Promise<void>
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
getViewport: Promise<UpdrawViewportState>
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
panToObject(object: UpdrawBaseObject): Promise<void>
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
centerObjectInViewport(object: UpdrawBaseObject): Promise<UpdrawBaseObject>
```

#### centerObjects

Moves the supplied objects so their combined bounds are centered in the viewport.

```ts
centerObjects(objects: UpdrawBaseObject[]): Promise<void>
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
getWorkspaces: Promise<UpdrawWorkspace[]>
```

#### getActiveWorkspace

Returns the currently active workspace.

```ts
getActiveWorkspace: Promise<UpdrawWorkspace>
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
  toolConfig?: UpdrawBrushToolConfig | UpdrawLineToolConfig | UpdrawTextToolConfig | UpdrawShapeToolConfig
): Promise<UpdrawBaseTool>
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

#### alignObjects

Aligns the currently selected objects according to the specified alignment.

```ts
alignObjects(alignment: UpdrawAlignment): Promise<void>
```

Alignment values: `StartHorizontal`, `CenterHorizontal`, `EndHorizontal`, `StartVertical`, `CenterVertical`, `EndVertical`.

---

## Grouping

#### group

Creates a group (`UpdrawGroup`) from the given objects. Requires at least two objects. They become one layer at the position of the topmost object, in a single undoable step. Resolves to the created group, or `null` when fewer than two objects could be grouped. To group the current selection, pass `await getSelectedObjects()`. See the engine's `group` for details.

```ts
group(objects: UpdrawBaseObject[]): Promise<UpdrawGroup | null>
```

#### ungroup

Ungroups the given groups. Their children become individual objects again and keep their stacking order, in a single undoable step. Resolves to the extracted children. To ungroup the current selection, pass the `UpdrawGroup` objects from `await getSelectedObjects()`. See the engine's `ungroup` for details.

```ts
ungroup(groups: UpdrawGroup[]): Promise<UpdrawBaseObject[]>
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
canExportSelectedObjectAs(format: UpdrawExportFormat): Promise<boolean>
```

#### exportSelectedObject

Exports the selected object in the requested format.

```ts
exportSelectedObject(format: UpdrawExportFormat): Promise<void>
```

#### getSelectedObjectSupportedExportFormats

Returns export formats supported by the selected object.

```ts
getSelectedObjectSupportedExportFormats(): Promise<UpdrawExportFormat[]>
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
| customFonts | UpdrawFontMap | Registers fonts for runtime rendering and text-tool usage. |
| theme | ThemeCode | Current active theme. |
| themes | UpdrawTheme[] | Available theme definitions. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| themeChange | ThemeCode | Emitted when the active theme changes. |

### Methods

#### registerFonts

Registers custom fonts for runtime rendering and text-tool usage.

```ts
registerFonts(fonts: UpdrawFontMap): Promise<void>
```

## Localization

### Props

| Property | Type | Description |
|----------|------|-------------|
| fallbackLocale | LocaleCode | Locale used to resolve terms missing from the active locale. |
| locale | LocaleCode | Current locale code used by the editor. |
| locales | UpdrawLocale[] | Available locale definitions with optional term overrides. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| localeChange | LocaleCode | Emitted when the active locale changes. |

### Methods

#### registerLocales

Registers locale definitions: `registerLocales(locales: UpdrawLocale[]): Promise<void>`.

#### getAvailableLocales

Returns available locale codes: `getAvailableLocales(): Promise<LocaleCode[]>`.

#### getLocale

Returns the active locale: `getLocale(): Promise<LocaleCode>`.

#### setLocale

Sets the active locale: `setLocale(code: LocaleCode): Promise<void>`.

#### t

Resolves a localized term: `t(key: UpdrawTermKey, vars?: UpdrawTermVars): Promise<string>`.

## User Management

### Props

| Property | Type | Description |
|----------|------|-------------|
| user | IUpdrawUser | Current authenticated user for awareness and collaboration state. |
| loginConfig | UpdrawLoginConfig | Login dialog provider configuration. |

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
| activeUsers | IUpdrawUser[] | Other users currently in the session. |
| syncConfig | UpdrawSyncConfig | Real-time collaboration provider configuration. |

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

## Agents

Agents are participants on the canvas that are driven by code, for example an AI assistant. Each agent is a [`UpdrawAgent`](./agent.md) with its own cursor, actions, and undo history. See [Agents](../advanced/agents.md) for a guide. When the editor shares presence, collaborators see its agents, and it shows theirs; see [Collaboration](../advanced/agents.md#collaboration).

### Props

| Property | Type | Description |
|----------|------|-------------|
| isAgentAvatarsVisible | boolean | Whether the avatar stack shows the agents, those of this editor and those of collaborators, after the active users (default `true`). Each agent has a bot badge, a ring while it works, and its status in the tooltip. |

### Events

| Event | Payload Type | Description |
|-------|--------------|-------------|
| agentsChange | UpdrawAgentsChangeEvent | Emitted when agents are added or removed, or when their name, color, avatar, status, visibility, or activity changes, in this editor or in the editor of a collaborator. Lists the agents of this editor first, then the agents of collaborators (`isRemote: true`). Never emitted for plain cursor motion. |

### Methods

#### addAgent

Adds an agent and shows its cursor. Adding the same agent again does nothing. An agent belongs to one editor at a time; an agent of an editor that was removed from the page moves here. Call it after the editor emitted `isReady`. Rejects for a value that is not an `UpdrawAgent`, for a second agent with the same ID, and for an agent of another editor.

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

### Methods

No titlebar-specific methods. Titlebar menus are rendered by the editor itself. Use [updateObject](#updateobject) to change the `name` of an existing object.

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
