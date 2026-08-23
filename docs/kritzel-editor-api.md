# `<kritzel-editor>` Public API

## Props

| Prop | Type | Default |
|------|------|---------|
| `scaleMax` | `number` | `ABSOLUTE_SCALE_MAX` |
| `scaleMin` | `number` | `ABSOLUTE_SCALE_MIN` |
| `lockDrawingScale` | `boolean` | `true` |
| `viewportBoundaryLeft` | `number` | `-Infinity` |
| `viewportBoundaryRight` | `number` | `Infinity` |
| `viewportBoundaryTop` | `number` | `-Infinity` |
| `viewportBoundaryBottom` | `number` | `Infinity` |
| `toolbar` | `KritzelToolbarControl[]` | Default toolbar set (selection, brush, line, eraser, text, shape, image, config) |
| `globalContextMenuItems` | `ContextMenuItem[]` | Paste, Select All |
| `objectContextMenuItems` | `ContextMenuItem[]` | Copy, Paste, Order, Align, Group, Delete |
| `customSvgIcons` | `Record<string, string>` | `{}` |
| `isToolbarVisible` | `boolean` | `true` |
| `isUtilityPanelVisible` | `boolean` | `true` |
| `syncConfig` | `KritzelSyncConfig` | `undefined` |

## Events

| Event | Payload Type |
|-------|-------------|
| `isReady` | `HTMLElement` |
| `objectsChange` | `KritzelBaseObject[]` |
| `objectsAdded` | `ObjectsAddedEvent` |
| `objectsRemoved` | `ObjectsRemovedEvent` |
| `objectsUpdated` | `ObjectsUpdatedEvent` |
| `undoStateChange` | `KritzelUndoState` |
| `themeChange` | `ThemeName` |
| `viewportChange` | `KritzelViewportState` |

## Methods

### Object CRUD

| Method | Signature |
|--------|-----------|
| `getObjectById` | `<T extends KritzelBaseObject>(id: string): Promise<T \| null>` |
| `addObject` | `<T extends KritzelBaseObject>(object: T): Promise<T \| null>` |
| `updateObject` | `<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>): Promise<T \| null>` |
| `removeObject` | `<T extends KritzelBaseObject>(object: T): Promise<T \| null>` |
| `getAllObjects` | `<T extends KritzelBaseObject>(): Promise<T[]>` |
| `findObjects` | `<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject) => boolean): Promise<T[]>` |
| `getObjectsTotalCount` | `(): Promise<number>` |
| `getObjectsInViewport` | `(): Promise<KritzelBaseObject[]>` |

### Selection

| Method | Signature |
|--------|-----------|
| `getSelectedObjects` | `(): Promise<KritzelBaseObject[]>` |
| `selectObjects` | `(objects: KritzelBaseObject[]): Promise<void>` |
| `selectAllObjectsInViewport` | `(): Promise<void>` |
| `clearSelection` | `(): Promise<void>` |
| `triggerSelectionChange` | `(): Promise<void>` |

### Viewport / Navigation

| Method | Signature |
|--------|-----------|
| `centerObjectInViewport` | `(object: KritzelBaseObject): Promise<void>` |
| `backToContent` | `(): Promise<boolean>` |
| `setViewport` | `(x: number, y: number, scale: number): Promise<void>` |
| `panTo` | `(x: number, y: number): Promise<void>` |
| `zoomTo` | `(scale: number, worldX?: number, worldY?: number): Promise<void>` |
| `getViewport` | `(): Promise<KritzelViewportState>` |
| `screenToWorld` | `(x: number, y: number): Promise<{ x: number; y: number }>` |
| `worldToScreen` | `(x: number, y: number): Promise<{ x: number; y: number }>` |

### Workspace

| Method | Signature |
|--------|-----------|
| `createWorkspace` | `(workspace: KritzelWorkspace): Promise<KritzelWorkspace \| null>` |
| `updateWorkspace` | `(workspace: KritzelWorkspace): Promise<void>` |
| `deleteWorkspace` | `(workspace: KritzelWorkspace): Promise<void>` |
| `getWorkspaces` | `(): Promise<KritzelWorkspace[]>` |
| `getActiveWorkspace` | `(): Promise<KritzelWorkspace>` |

### Tool Management

| Method | Signature |
|--------|-----------|
| `registerTool` | `(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig \| KritzelBrushToolConfig \| KritzelLineToolConfig \| KritzelShapeToolConfig): Promise<KritzelBaseTool>` |
| `changeActiveTool` | `(tool: KritzelBaseTool): Promise<void>` |
| `disable` | `(): Promise<void>` |
| `enable` | `(): Promise<void>` |

### Clipboard / Editing

| Method | Signature |
|--------|-----------|
| `copy` | `(): Promise<void>` |
| `paste` | `(x: number, y: number): Promise<void>` |
| `delete` | `(): Promise<void>` |

### Ordering

| Method | Signature |
|--------|-----------|
| `bringForward` | `(object?: KritzelBaseObject): Promise<void>` |
| `sendBackward` | `(object?: KritzelBaseObject): Promise<void>` |
| `bringToFront` | `(object?: KritzelBaseObject): Promise<void>` |
| `sendToBack` | `(object?: KritzelBaseObject): Promise<void>` |

### Alignment & Grouping

| Method | Signature |
|--------|-----------|
| `alignObjects` | `(alignment: KritzelAlignment): Promise<void>` |
| `group` | `(): Promise<void>` |
| `ungroup` | `(): Promise<void>` |

### Undo / Redo

| Method | Signature |
|--------|-----------|
| `undo` | `(): Promise<void>` |
| `redo` | `(): Promise<void>` |

### Export

| Method | Signature |
|--------|-----------|
| `getScreenshot` | `(format?: 'png' \| 'svg'): Promise<string>` |
| `exportViewportAsPng` | `(): Promise<void>` |
| `exportViewportAsSvg` | `(): Promise<void>` |

### Other

| Method | Signature |
|--------|-----------|
| `hideContextMenu` | `(): Promise<void>` |
| `getDisplayableShortcuts` | `(): Promise<Omit<KritzelShortcut, 'action' \| 'condition'>[]>` |
