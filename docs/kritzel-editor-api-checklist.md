# `<kritzel-editor>` Public API Checklist

## Props

- [ ] `scaleMax: number`
- [ ] `scaleMin: number`
- [ ] `lockDrawingScale: boolean`
- [ ] `viewportBoundaryLeft: number`
- [ ] `viewportBoundaryRight: number`
- [ ] `viewportBoundaryTop: number`
- [ ] `viewportBoundaryBottom: number`
- [ ] `toolbarItems: KritzelToolbarItem[]`
- [ ] `globalContextMenuItems: ContextMenuItem[]`
- [ ] `objectContextMenuItems: ContextMenuItem[]`
- [ ] `customSvgIcons: Record<string, string>`
- [ ] `isToolbarVisible: boolean`
- [ ] `isUtilityPanelVisible: boolean`
- [ ] `syncConfig: KritzelSyncConfig`

## Events

- [ ] `isReady: HTMLElement`
- [ ] `objectsChange: KritzelBaseObject[]`
- [ ] `objectsAdded: ObjectsAddedEvent`
- [ ] `objectsRemoved: ObjectsRemovedEvent`
- [ ] `objectsUpdated: ObjectsUpdatedEvent`
- [ ] `undoStateChange: KritzelUndoState`
- [ ] `themeChange: ThemeName`
- [ ] `viewportChange: KritzelViewportState`

## Methods

### Object CRUD

- [ ] `getObjectById<T>(id: string): Promise<T | null>`
- [ ] `addObject<T>(object: T): Promise<T | null>`
- [ ] `updateObject<T>(object: T, updatedProperties: Partial<T>): Promise<T | null>`
- [ ] `removeObject<T>(object: T): Promise<T | null>`
- [ ] `getAllObjects<T>(): Promise<T[]>`
- [ ] `findObjects<T>(predicate): Promise<T[]>`
- [ ] `getObjectsTotalCount(): Promise<number>`
- [ ] `getObjectsInViewport(): Promise<KritzelBaseObject[]>`

### Selection

- [ ] `getSelectedObjects(): Promise<KritzelBaseObject[]>`
- [ ] `selectObjects(objects: KritzelBaseObject[]): Promise<void>`
- [ ] `selectAllObjectsInViewport(): Promise<void>`
- [ ] `clearSelection(): Promise<void>`
- [ ] `triggerSelectionChange(): Promise<void>`

### Viewport / Navigation

- [ ] `centerObjectInViewport(object: KritzelBaseObject): Promise<void>`
- [ ] `backToContent(): Promise<boolean>`
- [ ] `setViewport(x: number, y: number, scale: number): Promise<void>`
- [ ] `panTo(x: number, y: number): Promise<void>`
- [ ] `zoomTo(scale: number, worldX?: number, worldY?: number): Promise<void>`
- [ ] `getViewport(): Promise<KritzelViewportState>`
- [ ] `screenToWorld(x: number, y: number): Promise<{ x: number; y: number }>`
- [ ] `worldToScreen(x: number, y: number): Promise<{ x: number; y: number }>`

### Workspace

- [ ] `createWorkspace(workspace: KritzelWorkspace): Promise<KritzelWorkspace | null>`
- [ ] `updateWorkspace(workspace: KritzelWorkspace): Promise<void>`
- [ ] `deleteWorkspace(workspace: KritzelWorkspace): Promise<void>`
- [ ] `getWorkspaces(): Promise<KritzelWorkspace[]>`
- [ ] `getActiveWorkspace(): Promise<KritzelWorkspace>`

### Tool Management

- [ ] `registerTool(toolName: string, toolClass: any, toolConfig?): Promise<KritzelBaseTool>`
- [ ] `changeActiveTool(tool: KritzelBaseTool): Promise<void>`
- [ ] `disable(): Promise<void>`
- [ ] `enable(): Promise<void>`

### Clipboard / Editing

- [ ] `copy(): Promise<void>`
- [ ] `paste(x: number, y: number): Promise<void>`
- [ ] `delete(): Promise<void>`

### Ordering

- [ ] `bringForward(object?: KritzelBaseObject): Promise<void>`
- [ ] `sendBackward(object?: KritzelBaseObject): Promise<void>`
- [ ] `bringToFront(object?: KritzelBaseObject): Promise<void>`
- [ ] `sendToBack(object?: KritzelBaseObject): Promise<void>`

### Alignment & Grouping

- [ ] `alignObjects(alignment: KritzelAlignment): Promise<void>`
- [ ] `group(): Promise<void>`
- [ ] `ungroup(): Promise<void>`

### Undo / Redo

- [ ] `undo(): Promise<void>`
- [ ] `redo(): Promise<void>`

### Export

- [ ] `getScreenshot(format?: 'png' | 'svg'): Promise<string>`
- [ ] `exportViewportAsPng(): Promise<void>`
- [ ] `exportViewportAsSvg(): Promise<void>`

### Other

- [ ] `hideContextMenu(): Promise<void>`
- [ ] `getDisplayableShortcuts(): Promise<Omit<KritzelShortcut, 'action' | 'condition'>[]>`
