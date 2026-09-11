---

sidebar_label: Engine
displayed_sidebar: tutorialSidebar
title: "Engine API Reference | Kritzel for React"
description: "Complete API reference for the headless Kritzel engine: rendering, viewport, pointer events, and workspace management."
---

# Engine

The `<kritzel-engine>` is the low-level headless canvas primitive. It handles rendering, viewport management, pointer events, undo/redo, and workspace management with no built-in controls.

All methods are async and return Promises. The `<KritzelEditor>` exposes all the same methods.

## Props

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

## Events

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

## Methods

### Object

#### addObject

Adds a new object to the canvas. The object is automatically assigned an ID, core reference, and z-index.

```ts
addObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
```

#### removeObject

Removes an object from the canvas.

```ts
removeObject<T extends KritzelBaseObject>(object: T): Promise<T | null>
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

### Selection

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

### Viewport & Navigation

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

#### zoomTo

Zooms the viewport to the given scale. Optionally centers on a world point; if omitted, zooms around the viewport center.

```ts
zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>
```

#### centerObjectInViewport

Pans and zooms the viewport to center on the given object.

```ts
centerObjectInViewport(object: KritzelBaseObject): Promise<KritzelBaseObject>
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

### Workspace

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

---

### Tool Management

#### registerTool

Registers a new drawing tool with the engine.

```ts
registerTool(
  toolName: string,
  toolClass: any,
  toolConfig?: KritzelBrushToolConfig | KritzelLineToolConfig | KritzelTextToolConfig | KritzelShapeToolConfig
): Promise<KritzelBaseTool>
```

#### changeActiveTool

Switches the active drawing tool. Deactivates the current tool and clears any selection.

```ts
changeActiveTool(toolName: string): Promise<void>
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

### Clipboard & Editing

#### copy

Copies the currently selected objects to the internal clipboard.

```ts
copy: Promise<void>
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

### Ordering

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

Groups the currently selected objects into a single group.

```ts
group: Promise<void>
```

#### ungroup

Ungroups the currently selected group back into individual objects.

```ts
ungroup: Promise<void>
```

---

### Undo & Redo

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

### Export

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

---

### Other

#### hideContextMenu

Hides the context menu and resets any associated selection state.

```ts
hideContextMenu: Promise<void>
```

#### getDisplayableShortcuts

Returns all registered keyboard shortcuts (without action/condition) for display in a help UI.

```ts
getDisplayableShortcuts: Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]>
```
