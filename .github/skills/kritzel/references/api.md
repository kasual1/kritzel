# Kritzel component API

Source version: @kritzel/engine and @kritzel/editor 0.4.35.

Generated from Stencil docs JSON. For framework bindings, use the matching setup and events references.

## <kritzel-engine>

### Props

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| activeWorkspaceId | string |  | Optional workspace ID to load. If provided, the engine will look up and load this workspace by ID. |
| assetStorageConfig | KritzelAssetStorageConfig |  | Configuration for binary asset storage (e.g., images). The Yjs document only persists asset ids; the actual bytes are stored by the providers listed here. Defaults to IndexedDB-only storage. To support cross-device image sync alongside a networked sync provider (Hocuspocus, WebSocket), configure at least one remote asset provider such as \`HttpAssetProvider\` or \`PresignedAssetProvider\`. |
| cursorTarget | HTMLElement |  | The HTML element to apply cursor styles to. Defaults to \`document.body\` if not set. |
| debugInfo | KritzelDebugInfo |  | Debug info display options controlling which debug overlays are visible |
| editorId | string |  | Optional unique identifier for namespacing storage keys across multiple editor instances. |
| fallbackLocale | "de" \| "en" \| "fr" \| string & {} |  | The locale used to resolve terms missing from the active locale. |
| globalContextMenuItems | ContextMenuItem[] |  | Context menu items shown when right-clicking the canvas background. |
| isPanningEnabled | boolean |  | When false, non-modified wheel events do not pan the viewport. |
| isZoomingEnabled | boolean |  | When false, Ctrl+wheel events do not zoom the viewport. |
| licenseKey | string |  | License key that, when valid, removes the "Powered by Kritzel" watermark. |
| locale | "de" \| "en" \| "fr" \| string & {} |  | The current locale (language) code to apply to the editor, e.g. 'en', 'de', 'fr'. |
| locales | KritzelLocale[] |  | An array of available locale definitions (with optional partial term overrides). Replaces the built-in locale set (en/de/fr) when provided, even if empty. |
| lockDrawingScale | boolean |  | When true, objects are drawn at a fixed visual size regardless of zoom level |
| objectContextMenuItems | ContextMenuItem[] |  | Context menu items shown when right-clicking a selected object. |
| scaleMax | number |  | Maximum zoom scale allowed. Clamped to the absolute maximum defined by the engine. |
| scaleMin | number |  | Minimum zoom scale allowed. Clamped to the absolute minimum defined by the engine. |
| syncConfig | KritzelSyncConfig |  | Configuration for real-time synchronization providers (e.g., IndexedDB, WebSocket). |
| theme | "dark" \| "light" \| string & {} |  | The current theme to apply to the editor |
| themes | KritzelTheme[] |  | An array of available themes for the editor. |
| tools | KritzelToolDefinition[] |  | Tool definitions to register with this engine instance. |
| user | IKritzelUser |  | The current user for awareness broadcasting (name, id, cursor position). |
| viewportBoundaryBottom | number |  | Bottom boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. |
| viewportBoundaryLeft | number |  | Left boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. |
| viewportBoundaryRight | number |  | Right boundary of the viewport in world coordinates. Objects beyond this X position cannot be panned to. |
| viewportBoundaryTop | number |  | Top boundary of the viewport in world coordinates. Objects beyond this Y position cannot be panned to. |
| workspaces | KritzelWorkspace[] |  | Authoritative workspace catalog for this engine instance. When provided, provider-only workspaces are hidden but not deleted. |

### Methods

| Name | Signature | Description |
| --- | --- | --- |
| addObject | addObject<T extends KritzelBaseObject>(object: T) => Promise<T \| null> | Adds a new object to the canvas. The object will be assigned an ID, core reference, and z-index automatically. |
| addObjects | addObjects<T extends KritzelBaseObject>(objects: T[]) => Promise<T[]> | Adds multiple objects to the canvas in a single batch operation. All objects are inserted within one Yjs transaction (single undo step), triggering only one rerender cycle. Intended for programmatic streaming scenarios where per-object overhead would cause stutter. |
| alignObjects | alignObjects(alignment: KritzelAlignment) => Promise<void> | Aligns the currently selected objects according to the specified alignment. |
| backToContent | backToContent() => Promise<boolean> | Pans and zooms the viewport to fit the nearest content, with padding. Useful when the user has panned away from all objects. |
| beginSceneBootstrap | beginSceneBootstrap() => Promise<void> | Starts a scene bootstrap phase by hiding the scene immediately. |
| bringForward | bringForward(object?: KritzelBaseObject<any>) => Promise<void> | Moves an object one layer forward in the z-order. |
| bringToFront | bringToFront(object?: KritzelBaseObject<any>) => Promise<void> | Moves an object to the very front of the z-order. |
| canExportSelectedObjectAs | canExportSelectedObjectAs(format: KritzelObjectExportFormat) => Promise<boolean> | Checks whether the currently selected object supports a specific export format. Returns false when none or multiple objects are selected. |
| cancelImportFromFile | cancelImportFromFile() => Promise<void> | Cancels an active file picker opened by importFromFile. |
| centerAllObjects | centerAllObjects(animate?: boolean) => Promise<boolean> | Pans and zooms the viewport to fit ALL objects on the canvas, including those not currently rendered. Calculates the combined bounding box of all objects and centers the viewport to show them. |
| centerObjectInViewport | centerObjectInViewport(object: KritzelBaseObject) => Promise<KritzelBaseObject<HTMLElement \| SVGElement>> | Pans and zooms the viewport to center on the given object. |
| centerObjects | centerObjects(objects: KritzelBaseObject[], animate?: boolean) => Promise<boolean> | Pans and zooms the viewport to fit the provided objects. Calculates the combined bounding box of the given objects and centers the viewport to show them. |
| clearSelection | clearSelection() => Promise<void> | Deselects all currently selected objects. |
| configureLocales | configureLocales(locales?: KritzelLocale[]) => Promise<void> | Declaratively configures the full locale catalog, replacing the available locale set. Pass \`undefined\` to restore the built-in locales (en/de/fr). |
| copy | copy() => Promise<void> | Copies the currently selected objects to the internal clipboard. |
| createWorkspace | createWorkspace(workspace: KritzelWorkspace) => Promise<KritzelWorkspace \| null> | Creates a new workspace and emits a \`workspacesChange\` event. Emits \`activeWorkspaceChange\` if the created workspace is activated. |
| cut | cut() => Promise<void> | Cuts the currently selected objects to the internal clipboard (deletes them from the canvas). |
| delete | delete() => Promise<void> | Deletes the currently selected objects from the canvas. |
| deleteWorkspace | deleteWorkspace(workspace: KritzelWorkspace) => Promise<void> | Deletes a workspace and emits a \`workspacesChange\` event. |
| disable | disable() => Promise<void> | Disables all user interaction with the engine (pointer, keyboard, etc.). |
| downloadAsJson | downloadAsJson(filename?: string) => Promise<void> | Exports the current workspace as a JSON file and triggers a browser download. |
| enable | enable() => Promise<void> | Re-enables user interaction after a call to \`disable()\`. |
| endSceneBootstrap | endSceneBootstrap() => Promise<void> | Ends a scene bootstrap phase by fading the scene back in. |
| exportAsJson | exportAsJson() => Promise<string> | Exports the current workspace and all its objects as a JSON string. The exported data includes workspace metadata (id, name, viewport) and all canvas objects. |
| exportSelectedObject | exportSelectedObject(format: KritzelObjectExportFormat) => Promise<void> | Exports the currently selected object in the requested format and triggers a file download. Only supports single selection. |
| exportViewportAsPng | exportViewportAsPng() => Promise<void> | Exports the current viewport as a PNG file and triggers a browser download. |
| exportViewportAsSvg | exportViewportAsSvg() => Promise<void> | Exports the current viewport as an SVG file and triggers a browser download. |
| findObjects | findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject<Element>) => boolean) => Promise<T[]> | Returns all objects that match the given predicate function. Excludes internal selection-related objects (selection groups and selection boxes). |
| getActiveWorkspace | getActiveWorkspace() => Promise<KritzelWorkspace> | Returns the currently active workspace. |
| getAllObjects | getAllObjects<T extends KritzelBaseObject>() => Promise<T[]> | Returns all objects on the canvas across all layers. |
| getAvailableLocaleOptions | getAvailableLocaleOptions() => Promise<{ code: LocaleCode; label: string; }[]> | Gets the list of available locales as \`{ code, label }\` options for a selector. |
| getAvailableLocales | getAvailableLocales() => Promise<LocaleCode[]> | Gets the list of available locale codes (built-in and registered). |
| getDisplayableShortcuts | getDisplayableShortcuts() => Promise<Omit<KritzelShortcut, "action" \| "condition">[]> | Returns all registered keyboard shortcuts (without action/condition) for display in a help UI. |
| getIsPublic | getIsPublic() => Promise<boolean> | Gets whether the active workspace is publicly accessible. |
| getLocale | getLocale() => Promise<LocaleCode> | Gets the currently active locale code. |
| getObjectById | getObjectById<T extends KritzelBaseObject>(id: string) => Promise<T \| null> | Retrieves a canvas object by its unique ID. |
| getObjectsInViewport | getObjectsInViewport() => Promise<KritzelBaseObject[]> | Returns all objects currently visible within the viewport bounds. |
| getObjectsTotalCount | getObjectsTotalCount() => Promise<number> | Returns the total number of objects on the canvas. |
| getResolvedTerms | getResolvedTerms() => Promise<Partial<Record<KritzelTermKey, string>>> | Resolves every known term key for the active locale into a flat map. Useful for UI layers that need to localize many strings at once. |
| getScreenshot | getScreenshot(format?: "png" \| "svg") => Promise<string \| null> | Captures a screenshot of the current viewport as a data URL. |
| getSelectedObjectSupportedExportFormats | getSelectedObjectSupportedExportFormats() => Promise<KritzelObjectExportFormat[]> | Returns export formats supported by the currently selected object. Only returns formats when exactly one object is selected. |
| getSelectedObjects | getSelectedObjects() => Promise<KritzelBaseObject<any>[]> | Returns the currently selected objects. Returns an empty array if nothing is selected. |
| getTool | getTool(toolName: string) => Promise<KritzelBaseTool \| null> | Returns a tool registered in this engine instance. |
| getViewport | getViewport() => Promise<KritzelViewportState> | Returns the current viewport state including position, scale, and dimensions. |
| getWorkspaces | getWorkspaces() => Promise<KritzelWorkspace[]> | Returns all available workspaces. |
| group | group() => Promise<void> | Groups the currently selected objects into a single selection group. |
| hideContextMenu | hideContextMenu() => Promise<void> | Hides the context menu and resets any associated selection state. |
| importFromFile | importFromFile() => Promise<void> | Opens a file picker dialog and imports the selected JSON file into the workspace. This method creates a hidden file input, triggers the browser's file chooser, reads the selected JSON file, and imports it using importFromJson. |
| importFromJson | importFromJson(json: string) => Promise<void> | Imports a workspace from a JSON string into a new workspace. Creates a new workspace with the imported data and automatically switches to it. |
| loadObjectsFromJson | loadObjectsFromJson(json: string) => Promise<number> | Loads objects from a workspace JSON string into the current workspace. Unlike importFromJson, this does not create a new workspace - it adds objects to the existing one. Useful for initializing a workspace with pre-existing content after the editor is ready. |
| loadSettings | loadSettings() => Promise<Partial<KritzelSettingsConfig> \| null> | Loads the persisted settings object from localStorage. |
| loadSharedWorkspace | loadSharedWorkspace(token: string) => Promise<void> | Loads a shared workspace by token. If the workspace exists locally, it switches to it. If it doesn't exist, it adds it to the local workspaces list and then switches to it. |
| openContextMenu | openContextMenu(options: { x: number; y: number; objectId?: string; }) => Promise<void> | Programmatically opens the context menu at a specified world-coordinate position. If \`objectId\` is provided and found, the object context menu is shown for that object. If no \`objectId\` is provided but a selection group already exists, the object context menu is shown. Otherwise, the global context menu is shown. |
| panTo | panTo(x: number, y: number) => Promise<void> | Pans the viewport to center on the given world coordinates without changing the scale. |
| panToObject | panToObject(object: KritzelBaseObject) => Promise<void> | Pans the viewport to center on the given object without changing the zoom level. Unlike \`centerObjectInViewport\`, this moves the camera — not the object. |
| paste | paste(x: number, y: number) => Promise<void> | Pastes previously copied objects at the specified world coordinates. |
| redo | redo() => Promise<void> | Redoes the last undone action. |
| registerLocales | registerLocales(locales: KritzelLocale[]) => Promise<void> | Registers additional locale definitions (with optional partial term overrides). |
| registerTool | registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig \| KritzelBrushToolConfig \| KritzelLineToolConfig \| KritzelShapeToolConfig) => Promise<KritzelBaseTool \| null> | Registers a new drawing tool with the engine. |
| reinitSync | reinitSync() => Promise<void> | Reinitializes sync by performing a full teardown and re-initialization. Destroys the current Yjs documents and providers, then rebuilds everything from the current syncConfig. Data reloads from IndexedDB nearly instantly. Call this after updating the syncConfig prop (e.g. after authentication state changes). |
| removeObject | removeObject<T extends KritzelBaseObject>(object: T) => Promise<T \| null> | Removes an object from the canvas. |
| removeObjects | removeObjects<T extends KritzelBaseObject>(objects: T[]) => Promise<T[]> | Removes multiple objects from the canvas in a single batch operation. All removals happen within one Yjs transaction (single undo step), triggering only one rerender cycle. Intended for programmatic streaming scenarios where per-object overhead would cause stutter. |
| saveSettings | saveSettings(settings: KritzelSettingsConfig) => Promise<void> | Persists the given settings object to localStorage using the namespaced storage key. |
| screenToWorld | screenToWorld(x: number, y: number) => Promise<{ x: number; y: number; }> | Converts screen-relative pixel coordinates to world coordinates. |
| selectAllObjectsInViewport | selectAllObjectsInViewport() => Promise<void> | Selects all objects currently visible in the viewport. Switches to the selection tool automatically. |
| selectObjects | selectObjects(objects: KritzelBaseObject[]) => Promise<void> | Programmatically selects the given objects. Switches to the selection tool automatically. |
| sendBackward | sendBackward(object?: KritzelBaseObject<any>) => Promise<void> | Moves an object one layer backward in the z-order. |
| sendToBack | sendToBack(object?: KritzelBaseObject<any>) => Promise<void> | Moves an object to the very back of the z-order. |
| setActiveTool | setActiveTool(toolName: string) => Promise<void> | Switches the active drawing tool by its registered name. |
| setActiveWorkspace | setActiveWorkspace(id: string) => Promise<void> | Switches the active workspace in the engine by ID. |
| setLocale | setLocale(code: LocaleCode) => Promise<void> | Sets the active locale (language) and re-renders the UI. |
| setViewport | setViewport(x: number, y: number, scale: number) => Promise<void> | Sets the viewport to center on the given world coordinates at the specified scale. |
| t | t(key: KritzelTermKey, vars?: KritzelTermVars) => Promise<string> | Resolves a term key to its translated string for the active locale. |
| triggerSelectionChange | triggerSelectionChange() => Promise<void> | Manually triggers the \`objectsSelectionChange\` event. |
| undo | undo() => Promise<void> | Undoes the last action. |
| ungroup | ungroup() => Promise<void> | Ungroups the currently selected group back into individual objects. |
| updateObject | updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>) => Promise<T \| null> | Updates properties of an existing canvas object. |
| updateWorkspace | updateWorkspace(workspace: KritzelWorkspace) => Promise<void> | Applies a workspace as declared and emits a \`workspacesChange\` event. Metadata and viewport are always applied. When \`workspace.objects\` is set it is treated as the complete desired object set (\`undefined\` leaves objects untouched, \`[]\` removes them all); updating objects of a non-active workspace requires a configured sync provider. |
| worldToScreen | worldToScreen(x: number, y: number) => Promise<{ x: number; y: number; }> | Converts world coordinates to screen-relative pixel coordinates. |
| zoomIn | zoomIn(factor: number, duration: number) => Promise<void> | Zooms in by a fixed step, centered on the current viewport center, with a smooth animation. |
| zoomOut | zoomOut(factor: number, duration: number) => Promise<void> | Zooms out by a fixed step, centered on the current viewport center, with a smooth animation. |
| zoomTo | zoomTo(scale: number, worldX?: number, worldY?: number) => Promise<void> | Zooms the viewport to the given scale level. Optionally centers on a world point; if omitted, zooms around the viewport center. |

### Events

| Name | Detail | Description |
| --- | --- | --- |
| activeToolChange | KritzelBaseTool | Emitted when the active drawing tool changes. |
| activeWorkspaceChange | KritzelWorkspace | Emitted when the active workspace changes (e.g., after import). |
| awarenessChange | Map<number, Record<string, any>> | Emitted when the awareness state changes (remote user cursors, presence). |
| contextMenuStateChange | KritzelContextMenuState | Emitted when context-menu visibility, items, or position changes. |
| isEngineReady | KritzelEngineState | Emitted when the engine has fully initialized and is ready for interaction. |
| isLoadingChange | boolean | Emitted while the selected workspace's objects are being initialized and synchronized. |
| longpress | PointerEvent | Emitted on long-press (touch/pen). Useful for showing custom context menus on mobile. |
| notificationsChange | KritzelNotification | Emitted when notifications change. |
| objectsAdded | ObjectsAddedEvent | Emitted when one or more objects are added to the canvas. |
| objectsChange | KritzelBaseObject<HTMLElement \| SVGElement>[] | Emitted when objects on the canvas are added, removed, or modified. |
| objectsInViewportChange | KritzelBaseObject<Element>[] | Emitted when the set of objects visible in the current viewport changes (e.g., after pan or zoom). |
| objectsRemoved | ObjectsRemovedEvent | Emitted when one or more objects are removed from the canvas. |
| objectsSelectionChange | KritzelBaseObject<HTMLElement \| SVGElement>[] | Emitted when the set of selected objects changes. |
| objectsUpdated | ObjectsUpdatedEvent | Emitted when one or more objects are updated on the canvas. |
| undoStateChange | KritzelUndoState | Emitted when the undo/redo state changes, providing current undo availability. |
| viewportChange | KritzelViewportState | Emitted when the viewport position, scale, or dimensions change (e.g., after pan, zoom, or resize). |
| workspacesChange | KritzelWorkspace[] | Emitted when workspaces are created, updated, or deleted. |

## <kritzel-editor>

### Props

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| activeUsers | IKritzelUser[] |  |  |
| activeWorkspaceId | string |  | Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID. |
| assetStorageConfig | KritzelAssetStorageConfig |  |  |
| cursorTarget | HTMLElement |  | The element to use as the target for the cursor. Defaults to the editor container if not set. |
| customFonts | { [x: string]: KritzelFontRegistration; } |  | Registers fonts for runtime usage (for example custom object rendering). Text-tool config tooltip options are controlled via toolbarItems[].config.availableFonts. |
| customSvgIcons | Partial<Record<"info" \| "type" \| "image" \| "download" \| "command" \| "cursor" \| "x" \| "copy" \| "eraser" \| "pen" \| "arrow" \| "arrowUpFromDot" \| "arrowDownFromDot" \| "highlighter" \| "shapes" \| "shapeRectangle" \| "shapeEllipse" \| "shapeTriangle" \| "imageOff" \| "chevronDown" \| "chevronUp" \| "chevronLeft" \| "chevronRight" \| "chevronsLeft" \| "paste" \| "cut" \| "delete" \| "bringToFront" \| "sendToBack" \| "selectAll" \| "upload" \| "undo" \| "redo" \| "plus" \| "minus" \| "ellipsisVertical" \| "check" \| "group" \| "ungroup" \| "moveVertical" \| "hand" \| "handGrab" \| "mousePointer" \| "pointer" \| "settings" \| "share" \| "palette" \| "ordering" \| "layoutTemplate" \| "align" \| "alignStartHorizontal" \| "alignCenterHorizontal" \| "alignEndHorizontal" \| "alignStartVertical" \| "alignCenterVertical" \| "alignEndVertical" \| "viewport" \| "logOut" \| "usersRound" \| "google" \| "facebook" \| "github" \| "braces" \| "heart", string>> & Record<string, string> |  |  |
| debugInfo | KritzelDebugInfo |  |  |
| editorId | string |  | Optional unique identifier for namespacing storage keys across multiple editor instances. |
| fallbackLocale | "de" \| "en" \| "fr" \| string & {} |  | The locale used to resolve terms missing from the active locale. |
| globalContextMenuItems | ContextMenuItem[] |  |  |
| isMoreMenuVisible | boolean |  |  |
| isPanningEnabled | boolean |  |  |
| isToolbarVisible | boolean |  |  |
| isUtilityPanelVisible | boolean |  |  |
| isWorkspaceManagerVisible | boolean |  |  |
| isZoomPanelVisible | boolean |  |  |
| isZoomingEnabled | boolean |  |  |
| licenseKey | string |  | License key that, when valid, removes the "Powered by Kritzel" watermark. |
| locale | "de" \| "en" \| "fr" \| string & {} |  | The current locale (language) code applied to the editor, e.g. 'en', 'de', 'fr'. |
| locales | KritzelLocale[] |  | An array of available locale definitions (with optional partial term overrides). |
| lockDrawingScale | boolean |  |  |
| loginConfig | KritzelLoginConfig |  | Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers. |
| moreMenuItems | IKritzelMenuItem<any>[] |  |  |
| objectContextMenuItems | ContextMenuItem[] |  |  |
| scaleMax | number |  |  |
| scaleMin | number |  |  |
| syncConfig | KritzelSyncConfig |  |  |
| theme | "dark" \| "light" \| string & {} |  |  |
| themes | KritzelTheme[] |  |  |
| toolbarItems | KritzelToolbarItem[] |  |  |
| user | IKritzelUser |  |  |
| viewportBoundaryBottom | number |  |  |
| viewportBoundaryLeft | number |  |  |
| viewportBoundaryRight | number |  |  |
| viewportBoundaryTop | number |  |  |
| workspaces | KritzelWorkspace[] |  | Authoritative workspace catalog for this editor instance. When provided, provider-only workspaces are hidden but not deleted. |

### Methods

| Name | Signature | Description |
| --- | --- | --- |
| addObject | addObject<T extends KritzelBaseObject>(object: T) => Promise<T \| null> |  |
| addObjects | addObjects<T extends KritzelBaseObject>(objects: T[]) => Promise<T[]> |  |
| alignObjects | alignObjects(alignment: KritzelAlignment) => Promise<void> |  |
| backToContent | backToContent() => Promise<boolean> |  |
| beginSceneBootstrap | beginSceneBootstrap() => Promise<void> |  |
| bringForward | bringForward(object?: KritzelBaseObject<any>) => Promise<void> |  |
| bringToFront | bringToFront(object?: KritzelBaseObject<any>) => Promise<void> |  |
| canExportSelectedObjectAs | canExportSelectedObjectAs(format: KritzelObjectExportFormat) => Promise<boolean> |  |
| centerAllObjects | centerAllObjects(animate?: boolean) => Promise<boolean> |  |
| centerObjectInViewport | centerObjectInViewport(object: KritzelBaseObject) => Promise<KritzelBaseObject<HTMLElement \| SVGElement>> |  |
| centerObjects | centerObjects(objects: KritzelBaseObject[], animate?: boolean) => Promise<boolean> |  |
| clearSelection | clearSelection() => Promise<void> |  |
| closeExportDialog | closeExportDialog() => Promise<void> |  |
| closeImportDialog | closeImportDialog() => Promise<void> |  |
| closeLoginDialog | closeLoginDialog() => Promise<void> |  |
| closeMoreMenu | closeMoreMenu() => Promise<void> |  |
| closeSettingsDialog | closeSettingsDialog() => Promise<void> |  |
| closeShareDialog | closeShareDialog() => Promise<void> |  |
| closeUserDialog | closeUserDialog() => Promise<void> |  |
| closeWorkspaceManagerMenu | closeWorkspaceManagerMenu() => Promise<void> |  |
| copy | copy() => Promise<void> |  |
| createWorkspace | createWorkspace(workspace: KritzelWorkspace) => Promise<KritzelWorkspace \| null> |  |
| cut | cut() => Promise<void> |  |
| delete | delete() => Promise<void> |  |
| deleteWorkspace | deleteWorkspace(workspace: KritzelWorkspace) => Promise<void> |  |
| disable | disable() => Promise<void> |  |
| downloadAsJson | downloadAsJson(filename?: string) => Promise<void> |  |
| enable | enable() => Promise<void> |  |
| endSceneBootstrap | endSceneBootstrap() => Promise<void> |  |
| exportAsJson | exportAsJson() => Promise<string> |  |
| exportSelectedObject | exportSelectedObject(format: KritzelObjectExportFormat) => Promise<void> |  |
| exportViewportAsPng | exportViewportAsPng() => Promise<void> |  |
| exportViewportAsSvg | exportViewportAsSvg() => Promise<void> |  |
| findObjects | findObjects<T extends KritzelBaseObject>(predicate: (obj: KritzelBaseObject<Element>) => boolean) => Promise<T[]> |  |
| getActiveWorkspace | getActiveWorkspace() => Promise<KritzelWorkspace> |  |
| getAllObjects | getAllObjects<T extends KritzelBaseObject>() => Promise<T[]> |  |
| getAvailableLocales | getAvailableLocales() => Promise<LocaleCode[]> | Gets the list of available locale codes (built-in and registered). |
| getDisplayableShortcuts | getDisplayableShortcuts() => Promise<Omit<KritzelShortcut, "action" \| "condition">[]> |  |
| getLocale | getLocale() => Promise<LocaleCode> | Gets the currently active locale code. |
| getObjectById | getObjectById<T extends KritzelBaseObject>(id: string) => Promise<T \| null> |  |
| getObjectsInViewport | getObjectsInViewport() => Promise<KritzelBaseObject[]> |  |
| getObjectsTotalCount | getObjectsTotalCount() => Promise<number> |  |
| getScreenshot | getScreenshot(format?: "png" \| "svg") => Promise<string \| null> |  |
| getSelectedObjectSupportedExportFormats | getSelectedObjectSupportedExportFormats() => Promise<KritzelObjectExportFormat[]> |  |
| getSelectedObjects | getSelectedObjects() => Promise<KritzelBaseObject[]> |  |
| getViewport | getViewport() => Promise<KritzelViewportState> |  |
| getWorkspaces | getWorkspaces() => Promise<KritzelWorkspace[]> |  |
| group | group() => Promise<void> |  |
| hideContextMenu | hideContextMenu() => Promise<void> |  |
| importFromFile | importFromFile() => Promise<void> |  |
| importFromJson | importFromJson(json: string) => Promise<void> |  |
| loadObjectsFromJson | loadObjectsFromJson(json: string) => Promise<number> |  |
| loadSharedWorkspace | loadSharedWorkspace(token: string) => Promise<void> |  |
| openContextMenu | openContextMenu(options: { x: number; y: number; objectId?: string; }) => Promise<void> |  |
| openExportDialog | openExportDialog() => Promise<void> |  |
| openImportDialog | openImportDialog() => Promise<void> |  |
| openLoginDialog | openLoginDialog() => Promise<void> |  |
| openMoreMenu | openMoreMenu() => Promise<void> |  |
| openSettingsDialog | openSettingsDialog() => Promise<void> |  |
| openShareDialog | openShareDialog() => Promise<void> |  |
| openUserDialog | openUserDialog() => Promise<void> |  |
| openWorkspaceManagerMenu | openWorkspaceManagerMenu() => Promise<void> |  |
| panTo | panTo(x: number, y: number) => Promise<void> |  |
| panToObject | panToObject(object: KritzelBaseObject) => Promise<void> |  |
| paste | paste(x: number, y: number) => Promise<void> |  |
| redo | redo() => Promise<void> |  |
| registerFonts | registerFonts(fonts: KritzelFontMap) => Promise<void> | Registers custom fonts for the editor runtime. |
| registerLocales | registerLocales(locales: KritzelLocale[]) => Promise<void> | Registers additional locale definitions (with optional partial term overrides). |
| registerTool | registerTool(toolName: string, toolClass: any, toolConfig?: KritzelTextToolConfig \| KritzelBrushToolConfig \| KritzelLineToolConfig \| KritzelShapeToolConfig) => Promise<KritzelBaseTool \| null> |  |
| reinitSync | reinitSync() => Promise<void> |  |
| removeObject | removeObject<T extends KritzelBaseObject>(object: T) => Promise<T \| null> |  |
| removeObjects | removeObjects<T extends KritzelBaseObject>(objects: T[]) => Promise<T[]> |  |
| screenToWorld | screenToWorld(x: number, y: number) => Promise<{ x: number; y: number; }> |  |
| selectAllObjectsInViewport | selectAllObjectsInViewport() => Promise<void> |  |
| selectObjects | selectObjects(objects: KritzelBaseObject[]) => Promise<void> |  |
| sendBackward | sendBackward(object?: KritzelBaseObject<any>) => Promise<void> |  |
| sendToBack | sendToBack(object?: KritzelBaseObject<any>) => Promise<void> |  |
| setActiveTool | setActiveTool(toolName: string) => Promise<void> |  |
| setActiveWorkspace | setActiveWorkspace(id: string) => Promise<void> |  |
| setLocale | setLocale(code: LocaleCode) => Promise<void> | Sets the active locale (language) and re-renders the UI. |
| setLoginLoading | setLoginLoading(provider: string \| null) => Promise<void> |  |
| setViewport | setViewport(x: number, y: number, scale: number) => Promise<void> |  |
| t | t(key: KritzelTermKey, vars?: KritzelTermVars) => Promise<string> | Resolves a term key to its translated string for the active locale. |
| triggerNotification | triggerNotification(notification: Omit<KritzelNotification, "id"> & Partial<Pick<KritzelNotification, "id" \| "timestamp">>) => Promise<void> | Triggers a UI notification programmatically. |
| triggerSelectionChange | triggerSelectionChange() => Promise<void> |  |
| undo | undo() => Promise<void> |  |
| ungroup | ungroup() => Promise<void> |  |
| updateObject | updateObject<T extends KritzelBaseObject>(object: T, updatedProperties: Partial<T>) => Promise<T \| null> |  |
| updateWorkspace | updateWorkspace(workspace: KritzelWorkspace) => Promise<void> |  |
| worldToScreen | worldToScreen(x: number, y: number) => Promise<{ x: number; y: number; }> |  |
| zoomIn | zoomIn(factor?: number, duration?: number) => Promise<void> |  |
| zoomOut | zoomOut(factor?: number, duration?: number) => Promise<void> |  |
| zoomTo | zoomTo(scale: number, worldX?: number, worldY?: number) => Promise<void> |  |

### Events

| Name | Detail | Description |
| --- | --- | --- |
| activeWorkspaceChange | ActiveWorkspaceChangeEvent |  |
| awarenessChange | Map<number, Record<string, any>> |  |
| isPublicChange | IKritzelIsPublicChangeEvent |  |
| isReady | EditorIsReadyEvent |  |
| localeChange | "de" \| "en" \| "fr" \| string & {} |  |
| login | LoginEvent |  |
| logout | void |  |
| objectsAdded | ObjectsAddedEvent |  |
| objectsChange | KritzelBaseObject<HTMLElement \| SVGElement>[] |  |
| objectsRemoved | ObjectsRemovedEvent |  |
| objectsSelectionChange | KritzelBaseObject<HTMLElement \| SVGElement>[] |  |
| objectsUpdated | ObjectsUpdatedEvent |  |
| themeChange | "dark" \| "light" \| string & {} |  |
| undoStateChange | KritzelUndoState |  |
| viewportChange | KritzelViewportState |  |

