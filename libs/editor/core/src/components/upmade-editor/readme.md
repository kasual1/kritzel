| `objectContextMenuItems`    | --                             |                                                                                                                                                                    | `ContextMenuItem[]`                         | `[     { label: 'menu.copy', icon: 'copy', group: 'clipboard', action: () => this.engineRef.copy() },     { label: 'menu.cut', icon: 'cut', group: 'clipboard', action: () => this.engineRef.cut() },     {       label: 'menu.paste',       icon: 'paste',       group: 'clipboard',       action: (menu, _) => this.engineRef.paste(menu.x, menu.y),     },     {       label: 'menu.export',       icon: 'upload',       group: 'clipboard',       isVisible: (_, objects) => this.canExportObjects(objects),       action: (_, objects) => {         const format = this.getPreferredExportFormat(objects);         if (!format) {           return;         }          void this.engineRef.exportSelectedObject(format);       },     },     {       label: 'menu.order',       icon: 'ordering',       group: 'other',       children: [         { label: 'menu.bringToFront', icon: 'bringToFront', action: () => this.engineRef.bringToFront() },         { label: 'menu.sendToBack', icon: 'sendToBack', action: () => this.engineRef.sendToBack() },         { label: 'menu.moveUp', icon: 'arrowUpFromDot', action: () => this.engineRef.bringForward() },         { label: 'menu.moveDown', icon: 'arrowDownFromDot', action: () => this.engineRef.sendBackward() },       ],     },     {       label: 'menu.align',       icon: 'align',       group: 'other',       children: [         { label: 'menu.alignLeft', icon: 'alignStartVertical', action: () => this.engineRef.alignObjects(UpmadeAlignment.StartHorizontal) },         { label: 'menu.alignCenterHorizontal', icon: 'alignCenterHorizontal', action: () => this.engineRef.alignObjects(UpmadeAlignment.CenterHorizontal) },         { label: 'menu.alignRight', icon: 'alignEndVertical', action: () => this.engineRef.alignObjects(UpmadeAlignment.EndHorizontal) },         { label: 'menu.alignTop', icon: 'alignStartHorizontal', action: () => this.engineRef.alignObjects(UpmadeAlignment.StartVertical) },         { label: 'menu.alignCenterVertical', icon: 'alignCenterVertical', action: () => this.engineRef.alignObjects(UpmadeAlignment.CenterVertical) },         { label: 'menu.alignBottom', icon: 'alignEndHorizontal', action: () => this.engineRef.alignObjects(UpmadeAlignment.EndVertical) },       ],     },     { label: 'menu.group', icon: 'group', group: 'other', action: () => this.engineRef.groupSelectedObjects() },     { label: 'menu.ungroup', icon: 'ungroup', group: 'other', action: () => this.engineRef.ungroupSelectedObjects() },     { label: 'menu.delete', icon: 'delete', group: 'destructive', action: () => this.engineRef.delete() },   ]` |
# upmade-edito
<!-- Auto Generated Below -->


## Properties

| Property                    | Attribute                      | Description                                                                                                                                                                                                                                                                                                  | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeUsers`               | --                             |                                                                                                                                                                                                                                                                                                              | `IUpmadeUser[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `activeWorkspaceId`         | `active-workspace-id`          | Optional workspace ID to set as active. If provided, the editor will automatically activate the workspace with this ID.                                                                                                                                                                                      | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `assetStorageConfig`        | --                             |                                                                                                                                                                                                                                                                                                              | `UpmadeAssetStorageConfig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `DEFAULT_ASSET_STORAGE_CONFIG`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `chatBoxChips`              | --                             | Chips shown above the chat box, e.g. the selected object or the element the next prompt refers to. Up to three share one row as wide as the box; the rest are summarized as "+N more". Pass a new array to change them. The editor never removes chips itself: update the array when `chatChipRemove` fires. | `UpmadeChatBoxChip[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `chatBoxMode`               | `chat-box-mode`                | Initial chat box mode. A collapsed chat box expands automatically when its text overflows one row.                                                                                                                                                                                                           | `"collapsed" \| "expanded"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `"collapsed"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `chatSession`               | --                             | A chat session the chat box sends its prompts to, with `chatBoxChips` as what they refer to. While it runs, the chat box shows its progress and the stop button stops it. Call `preventDefault()` on `chatSubmit` to send a prompt yourself.                                                                 | `UpmadeChatSession`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `cursorTarget`              | --                             | The element to use as the target for the cursor. Defaults to the editor container if not set.                                                                                                                                                                                                                | `HTMLElement`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `customFonts`               | --                             | Registers fonts for runtime usage (for example custom object rendering). Text-tool config tooltip options are controlled via toolbarItems[].config.availableFonts.                                                                                                                                           | `{ [x: string]: UpmadeFontRegistration; }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `{}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `customSvgIcons`            | --                             |                                                                                                                                                                                                                                                                                                              | `Partial<Record<"info" \| "type" \| "settings" \| "image" \| "download" \| "command" \| "cursor" \| "square" \| "x" \| "copy" \| "pen" \| "highlighter" \| "arrowUp" \| "arrow" \| "arrowUpFromDot" \| "arrowDownFromDot" \| "eraser" \| "shapes" \| "shapeRectangle" \| "shapeEllipse" \| "shapeTriangle" \| "imageOff" \| "chevronDown" \| "chevronUp" \| "chevronLeft" \| "chevronRight" \| "chevronsLeft" \| "paste" \| "cut" \| "delete" \| "bringToFront" \| "sendToBack" \| "selectAll" \| "upload" \| "undo" \| "redo" \| "plus" \| "play" \| "minus" \| "ellipsisVertical" \| "check" \| "group" \| "ungroup" \| "moveVertical" \| "hand" \| "handGrab" \| "mousePointer" \| "pointer" \| "share" \| "palette" \| "ordering" \| "layoutTemplate" \| "align" \| "alignStartHorizontal" \| "alignCenterHorizontal" \| "alignEndHorizontal" \| "alignStartVertical" \| "alignCenterVertical" \| "alignEndVertical" \| "viewport" \| "logOut" \| "usersRound" \| "google" \| "facebook" \| "github" \| "braces" \| "heart", string>> & Record<string, string>` | `{}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `debugInfo`                 | --                             |                                                                                                                                                                                                                                                                                                              | `UpmadeDebugInfo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `{     showViewportInfo: false,     showObjectInfo: false,     showSyncProviderInfo: true,     showMigrationInfo: true,     showAssetResolverInfo: false,   }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `editorId`                  | `editor-id`                    | Optional unique identifier for namespacing storage keys across multiple editor instances.                                                                                                                                                                                                                    | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `fallbackLocale`            | `fallback-locale`              | The locale used to resolve terms missing from the active locale.                                                                                                                                                                                                                                             | `"de" \| "en" \| "fr" \| string & {}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `"en"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `globalContextMenuItems`    | --                             |                                                                                                                                                                                                                                                                                                              | `ContextMenuItem[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `[     {       label: "menu.paste",       icon: "paste",       action: (menu) => this.engineRef.paste(menu.x, menu.y),     },     {       label: "menu.selectAll",       icon: "selectAll",       action: () => this.selectAllObjectsInViewport(),     },   ]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `isAgentAvatarsVisible`     | `is-agent-avatars-visible`     | Whether the avatar stack shows agents (local ones and those of collaborators) after the active users.                                                                                                                                                                                                        | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isChatBoxLoading`          | `is-chat-box-loading`          | Whether the chat box shows its progress ring and turns its send button into a stop button.                                                                                                                                                                                                                   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `isChatBoxVisible`          | `is-chat-box-visible`          |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `isMoreMenuVisible`         | `is-more-menu-visible`         |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isPanningEnabled`          | `is-panning-enabled`           |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isToolbarVisible`          | `is-toolbar-visible`           |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isUtilityPanelVisible`     | `is-utility-panel-visible`     |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isWatermarkVisible`        | `is-watermark-visible`         | Whether the "Powered by Upmade" watermark is shown. Keeping it visible helps support the project.                                                                                                                                                                                                            | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isWorkspaceManagerVisible` | `is-workspace-manager-visible` |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isZoomPanelVisible`        | `is-zoom-panel-visible`        |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `isZoomingEnabled`          | `is-zooming-enabled`           |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `locale`                    | `locale`                       | The current locale (language) code applied to the editor, e.g. 'en', 'de', 'fr'.                                                                                                                                                                                                                             | `"de" \| "en" \| "fr" \| string & {}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `"en"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `locales`                   | --                             | An array of available locale definitions (with optional partial term overrides).                                                                                                                                                                                                                             | `UpmadeLocale[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `lockDrawingScale`          | `lock-drawing-scale`           |                                                                                                                                                                                                                                                                                                              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `loginConfig`               | --                             | Optional login configuration. When provided, a "Sign in" button is shown that opens a login dialog with the configured providers.                                                                                                                                                                            | `UpmadeLoginConfig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `moreMenuItems`             | --                             |                                                                                                                                                                                                                                                                                                              | `IUpmadeMenuItem<any>[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `[     {       id: "share",       label: "menu.share",       icon: "share",       isVisible: async () => hasRemoteSyncProvider(this.syncConfig),       action: () => {         if (!this.isLoggedIn && this.loginConfig) {           this.openLoginDialog();           return;         }         this.shareDialogRef.open();       },     },     {       id: "export",       label: "menu.export",       icon: "upload",       action: async () => {         const preview = await this.engineRef.getScreenshot("png");         this.exportRef.open(preview ?? undefined);       },     },     {       id: "import",       label: "menu.import",       icon: "download",       action: () => this.engineRef.importFromFile(),     },     {       id: "settings",       label: "menu.settings",       icon: "settings",       action: () => this.settingsRef.open(),     },   ]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `objectConfig`              | --                             | Configures how objects behave, in one place for all objects: which objects get a titlebar, and which can be rotated or resized. Each option is a boolean or a function of the object.                                                                                                                        | `UpmadeObjectConfig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `objectContextMenuItems`    | --                             |                                                                                                                                                                                                                                                                                                              | `ContextMenuItem[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `[     {       label: "menu.copy",       icon: "copy",       group: "clipboard",       action: () => this.engineRef.copy(),     },     {       label: "menu.cut",       icon: "cut",       group: "clipboard",       action: () => this.engineRef.cut(),     },     {       label: "menu.paste",       icon: "paste",       group: "clipboard",       action: (menu, _) => this.engineRef.paste(menu.x, menu.y),     },     {       label: "menu.export",       icon: "upload",       group: "clipboard",       isVisible: (_, objects) => this.canExportObjects(objects),       action: (_, objects) => {         const format = this.getPreferredExportFormat(objects);         if (!format) {           return;         }          void this.engineRef.exportSelectedObject(format);       },     },     {       label: "menu.order",       icon: "ordering",       group: "other",       children: [         {           label: "menu.bringToFront",           icon: "bringToFront",           action: () => this.engineRef.bringToFront(),         },         {           label: "menu.sendToBack",           icon: "sendToBack",           action: () => this.engineRef.sendToBack(),         },         {           label: "menu.moveUp",           icon: "arrowUpFromDot",           action: () => this.engineRef.bringForward(),         },         {           label: "menu.moveDown",           icon: "arrowDownFromDot",           action: () => this.engineRef.sendBackward(),         },       ],     },     {       label: "menu.align",       icon: "align",       group: "other",       children: [         {           label: "menu.alignLeft",           icon: "alignStartVertical",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.StartHorizontal),         },         {           label: "menu.alignCenterHorizontal",           icon: "alignCenterHorizontal",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.CenterHorizontal),         },         {           label: "menu.alignRight",           icon: "alignEndVertical",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.EndHorizontal),         },         {           label: "menu.alignTop",           icon: "alignStartHorizontal",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.StartVertical),         },         {           label: "menu.alignCenterVertical",           icon: "alignCenterVertical",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.CenterVertical),         },         {           label: "menu.alignBottom",           icon: "alignEndHorizontal",           action: () =>             this.engineRef.alignObjects(UpmadeAlignment.EndVertical),         },       ],     },     {       label: "menu.group",       icon: "group",       group: "other",       children: [         {           label: "menu.group",           icon: "group",           action: (_, objects) => this.engineRef.group(objects),         },         {           label: "menu.ungroup",           icon: "ungroup",           action: (_, objects) => {             const groups = objects.filter(               (object): object is UpmadeGroup =>                 object.__class__ === "UpmadeGroup",             );             this.engineRef.ungroup(groups);           },         },       ],     },     {       label: "menu.delete",       icon: "delete",       group: "edit",       action: () => this.engineRef.delete(),     },   ]` |
| `objectTitlebar`            | --                             | Content of the titlebar rendered above every object for which `objectConfig.hasTitlebar` is true. The same configuration applies to all objects. Leave unset to disable titlebars.                                                                                                                           | `UpmadeObjectTitlebarConfig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `scaleMax`                  | `scale-max`                    |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `1000`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `scaleMin`                  | `scale-min`                    |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0.0001`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `syncConfig`                | --                             |                                                                                                                                                                                                                                                                                                              | `UpmadeSyncConfig`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `DEFAULT_SYNC_CONFIG`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `theme`                     | `theme`                        |                                                                                                                                                                                                                                                                                                              | `"dark" \| "light" \| string & {}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `"light"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `themes`                    | --                             |                                                                                                                                                                                                                                                                                                              | `UpmadeTheme[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `toolbarItems`              | --                             |                                                                                                                                                                                                                                                                                                              | `UpmadeToolbarItem[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `[     {       name: "selection",       type: "tool",       isDefault: true,       tool: UpmadeSelectionTool,       icon: "cursor",     },     {       name: "brush",       type: "tool",       tool: UpmadeBrushTool,       icon: "pen",       config: DEFAULT_BRUSH_CONFIG,     },     {       name: "eraser",       type: "tool",       tool: UpmadeEraserTool,       icon: "eraser",     },     {       name: "line",       type: "tool",       tool: UpmadeLineTool,       icon: "arrow",       config: DEFAULT_LINE_TOOL_CONFIG,     },     {       name: "shape",       type: "tool",       tool: UpmadeShapeTool,       icon: "shapeRectangle",       config: DEFAULT_SHAPE_CONFIG,       subOptions: [         {           id: "rectangle",           icon: "shapeRectangle",           label: "Rectangle",           value: ShapeType.Rectangle,           toolProperty: "shapeType",         },         {           id: "ellipse",           icon: "shapeEllipse",           label: "Ellipse",           value: ShapeType.Ellipse,           toolProperty: "shapeType",         },         {           id: "triangle",           icon: "shapeTriangle",           label: "Triangle",           value: ShapeType.Triangle,           toolProperty: "shapeType",         },       ],     },     {       name: "text",       type: "tool",       tool: UpmadeTextTool,       icon: "type",       config: DEFAULT_TEXT_CONFIG,     },     {       name: "image",       type: "tool",       tool: UpmadeImageTool,       icon: "image",     },     {       name: "config",       type: "config",     },   ]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `user`                      | --                             |                                                                                                                                                                                                                                                                                                              | `IUpmadeUser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `viewportBoundaryBottom`    | `viewport-boundary-bottom`     |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `Infinity`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `viewportBoundaryLeft`      | `viewport-boundary-left`       |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `-Infinity`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `viewportBoundaryRight`     | `viewport-boundary-right`      |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `Infinity`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `viewportBoundaryTop`       | `viewport-boundary-top`        |                                                                                                                                                                                                                                                                                                              | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `-Infinity`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `workspaces`                | --                             | Authoritative workspace catalog for this editor instance. When provided, provider-only workspaces are hidden but not deleted.                                                                                                                                                                                | `UpmadeWorkspace[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |


## Events

| Event                    | Description                                                                                                                                                                                                                      | Type                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `activeWorkspaceChange`  |                                                                                                                                                                                                                                  | `CustomEvent<ActiveWorkspaceChangeEvent>`                    |
| `agentsChange`           | Emitted when agents are added or removed, or when what the avatar stack shows of them changes (name, color, avatar, status, visibility, activity). Never emitted for plain cursor motion.                                        | `CustomEvent<UpmadeAgentsChangeEvent>`                       |
| `awarenessChange`        |                                                                                                                                                                                                                                  | `CustomEvent<Map<number, Record<string, any>>>`              |
| `chatChipRemove`         | Emitted with the chat box chip whose remove button the user activated. The chip stays until `chatBoxChips` no longer contains it.                                                                                                | `CustomEvent<UpmadeChatBoxChip>`                             |
| `chatStop`               | Emitted when the user stops the current chat response. A `chatSession` is stopped too.                                                                                                                                           | `CustomEvent<void>`                                          |
| `chatSubmit`             | Emitted with the chat box text when the user submits it. With a `chatSession`, the prompt is sent to it unless a listener calls `preventDefault()`.                                                                              | `CustomEvent<string>`                                        |
| `isPublicChange`         |                                                                                                                                                                                                                                  | `CustomEvent<IUpmadeIsPublicChangeEvent>`                    |
| `isReady`                |                                                                                                                                                                                                                                  | `CustomEvent<EditorIsReadyEvent>`                            |
| `localeChange`           |                                                                                                                                                                                                                                  | `CustomEvent<"de" \| "en" \| "fr" \| string & {}>`           |
| `login`                  |                                                                                                                                                                                                                                  | `CustomEvent<LoginEvent>`                                    |
| `logout`                 |                                                                                                                                                                                                                                  | `CustomEvent<void>`                                          |
| `objectElementClick`     | Emitted when the user clicks an element inside the content of an interactive (selected) object. The click works as usual.                                                                                                        | `CustomEvent<UpmadeObjectElementClickEvent>`                 |
| `objectElementHover`     | Emitted when the pointer moves onto another element inside the content of an interactive (selected) object, such as an iframe object, and with `element: null` when it leaves the content or the object stops being interactive. | `CustomEvent<UpmadeObjectElementHoverEvent>`                 |
| `objectElementPick`      | Emitted when the user picks an element inside an object that is picking elements, see `setObjectElementPicking`.                                                                                                                 | `CustomEvent<UpmadeObjectElementPickEvent>`                  |
| `objectsAdded`           | Emitted when objects are added. `source` is set when an agent made the change.                                                                                                                                                   | `CustomEvent<ObjectsAddedEvent>`                             |
| `objectsChange`          |                                                                                                                                                                                                                                  | `CustomEvent<UpmadeBaseObject<HTMLElement \| SVGElement>[]>` |
| `objectsRemoved`         | Emitted when objects are removed. `source` is set when an agent made the change.                                                                                                                                                 | `CustomEvent<ObjectsRemovedEvent>`                           |
| `objectsSelectionChange` |                                                                                                                                                                                                                                  | `CustomEvent<UpmadeBaseObject<HTMLElement \| SVGElement>[]>` |
| `objectsUpdated`         | Emitted when objects are updated. `source` is set when an agent made the change.                                                                                                                                                 | `CustomEvent<ObjectsUpdatedEvent>`                           |
| `objectTitlebarAction`   | Emitted when a button or a menu item in an object titlebar is clicked.                                                                                                                                                           | `CustomEvent<UpmadeObjectTitlebarActionEvent>`               |
| `themeChange`            |                                                                                                                                                                                                                                  | `CustomEvent<"dark" \| "light" \| string & {}>`              |
| `undoStateChange`        |                                                                                                                                                                                                                                  | `CustomEvent<UpmadeUndoState>`                               |
| `viewportChange`         |                                                                                                                                                                                                                                  | `CustomEvent<UpmadeViewportState>`                           |


## Methods

### `addAgent(agent: UpmadeAgent) => Promise<UpmadeAgent>`

Adds an agent and shows its cursor. Adding the same agent again does nothing. An agent belongs to
one editor at a time; an agent of an editor that was removed from the page moves here.
Call it after the editor emitted `isReady`.

#### Parameters

| Name    | Type          | Description                      |
| ------- | ------------- | -------------------------------- |
| `agent` | `UpmadeAgent` | - A `new UpmadeAgent({ name })`. |

#### Returns

Type: `Promise<UpmadeAgent>`

The same agent.

### `addObject<T extends UpmadeBaseObject>(object: T) => Promise<T | null>`



#### Parameters

| Name     | Type | Description |
| -------- | ---- | ----------- |
| `object` | `T`  |             |

#### Returns

Type: `Promise<T>`



### `addObjects<T extends UpmadeBaseObject>(objects: T[]) => Promise<T[]>`



#### Parameters

| Name      | Type  | Description |
| --------- | ----- | ----------- |
| `objects` | `T[]` |             |

#### Returns

Type: `Promise<T[]>`



### `alignObjects(alignment: UpmadeAlignment) => Promise<void>`



#### Parameters

| Name        | Type              | Description |
| ----------- | ----------------- | ----------- |
| `alignment` | `UpmadeAlignment` |             |

#### Returns

Type: `Promise<void>`



### `backToContent() => Promise<boolean>`



#### Returns

Type: `Promise<boolean>`



### `beginSceneBootstrap() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `bringForward(object?: UpmadeBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                    | Description |
| -------- | ----------------------- | ----------- |
| `object` | `UpmadeBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `bringToFront(object?: UpmadeBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                    | Description |
| -------- | ----------------------- | ----------- |
| `object` | `UpmadeBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `canExportSelectedObjectAs(format: UpmadeObjectExportFormat) => Promise<boolean>`



#### Parameters

| Name     | Type             | Description |
| -------- | ---------------- | ----------- |
| `format` | `"svg" \| "png"` |             |

#### Returns

Type: `Promise<boolean>`



### `centerAllObjects(animate?: boolean) => Promise<boolean>`



#### Parameters

| Name      | Type      | Description |
| --------- | --------- | ----------- |
| `animate` | `boolean` |             |

#### Returns

Type: `Promise<boolean>`



### `centerObjectInViewport(object: UpmadeBaseObject) => Promise<UpmadeBaseObject<HTMLElement | SVGElement>>`



#### Parameters

| Name     | Type                                          | Description |
| -------- | --------------------------------------------- | ----------- |
| `object` | `UpmadeBaseObject<HTMLElement \| SVGElement>` |             |

#### Returns

Type: `Promise<UpmadeBaseObject<HTMLElement | SVGElement>>`



### `centerObjects(objects: UpmadeBaseObject[], animate?: boolean) => Promise<boolean>`



#### Parameters

| Name      | Type                                            | Description |
| --------- | ----------------------------------------------- | ----------- |
| `objects` | `UpmadeBaseObject<HTMLElement \| SVGElement>[]` |             |
| `animate` | `boolean`                                       |             |

#### Returns

Type: `Promise<boolean>`



### `clearObjectElementHighlights(objectId?: string) => Promise<void>`

Removes element highlights.

#### Parameters

| Name       | Type     | Description                                                                                    |
| ---------- | -------- | ---------------------------------------------------------------------------------------------- |
| `objectId` | `string` | - The object whose highlights are removed. Removes the highlights of all objects when omitted. |

#### Returns

Type: `Promise<void>`



### `clearSelection() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeExportDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeImportDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeLoginDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeMoreMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeSettingsDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeShareDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeUserDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `closeWorkspaceManagerMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `copy() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `createWorkspace(workspace: UpmadeWorkspace) => Promise<UpmadeWorkspace | null>`



#### Parameters

| Name        | Type              | Description |
| ----------- | ----------------- | ----------- |
| `workspace` | `UpmadeWorkspace` |             |

#### Returns

Type: `Promise<UpmadeWorkspace>`



### `cut() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `delete() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `deleteWorkspace(workspace: UpmadeWorkspace) => Promise<void>`



#### Parameters

| Name        | Type              | Description |
| ----------- | ----------------- | ----------- |
| `workspace` | `UpmadeWorkspace` |             |

#### Returns

Type: `Promise<void>`



### `disable() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `downloadAsJson(filename?: string) => Promise<void>`



#### Parameters

| Name       | Type     | Description |
| ---------- | -------- | ----------- |
| `filename` | `string` |             |

#### Returns

Type: `Promise<void>`



### `enable() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `endSceneBootstrap() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `exportAsJson() => Promise<string>`



#### Returns

Type: `Promise<string>`



### `exportSelectedObject(format: UpmadeObjectExportFormat) => Promise<void>`



#### Parameters

| Name     | Type             | Description |
| -------- | ---------------- | ----------- |
| `format` | `"svg" \| "png"` |             |

#### Returns

Type: `Promise<void>`



### `exportViewportAsPng() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `exportViewportAsSvg() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `findObjects<T extends UpmadeBaseObject>(predicate: (obj: UpmadeBaseObject<Element>) => boolean) => Promise<T[]>`



#### Parameters

| Name        | Type                                          | Description |
| ----------- | --------------------------------------------- | ----------- |
| `predicate` | `(obj: UpmadeBaseObject<Element>) => boolean` |             |

#### Returns

Type: `Promise<T[]>`



### `getActiveWorkspace() => Promise<UpmadeWorkspace>`



#### Returns

Type: `Promise<UpmadeWorkspace>`



### `getAgent(id: string) => Promise<UpmadeAgent | null>`

Returns an added agent by its ID.

#### Parameters

| Name | Type     | Description       |
| ---- | -------- | ----------------- |
| `id` | `string` | - The agent's ID. |

#### Returns

Type: `Promise<UpmadeAgent>`



### `getAgents() => Promise<UpmadeAgent[]>`

Returns the added agents.

#### Returns

Type: `Promise<UpmadeAgent[]>`



### `getAllObjects<T extends UpmadeBaseObject>() => Promise<T[]>`



#### Returns

Type: `Promise<T[]>`



### `getAvailableLocales() => Promise<LocaleCode[]>`

Gets the list of available locale codes (built-in and registered).

#### Returns

Type: `Promise<LocaleCode[]>`



### `getDisplayableShortcuts() => Promise<Omit<UpmadeShortcut, "action" | "condition">[]>`



#### Returns

Type: `Promise<Omit<UpmadeShortcut, "action" | "condition">[]>`



### `getLocale() => Promise<LocaleCode>`

Gets the currently active locale code.

#### Returns

Type: `Promise<LocaleCode>`



### `getObjectById<T extends UpmadeBaseObject>(id: string) => Promise<T | null>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `id` | `string` |             |

#### Returns

Type: `Promise<T>`



### `getObjectsInViewport() => Promise<UpmadeBaseObject[]>`



#### Returns

Type: `Promise<UpmadeBaseObject<HTMLElement | SVGElement>[]>`



### `getObjectsTotalCount() => Promise<number>`



#### Returns

Type: `Promise<number>`



### `getRemoteAgents() => Promise<UpmadeRemoteAgentPresence[]>`

Returns the agents of collaborators, as shared through presence.

#### Returns

Type: `Promise<UpmadeRemoteAgentPresence[]>`



### `getScreenshot(format?: "png" | "svg") => Promise<string | null>`



#### Parameters

| Name     | Type             | Description |
| -------- | ---------------- | ----------- |
| `format` | `"svg" \| "png"` |             |

#### Returns

Type: `Promise<string>`



### `getSelectedObjectSupportedExportFormats() => Promise<UpmadeObjectExportFormat[]>`



#### Returns

Type: `Promise<UpmadeObjectExportFormat[]>`



### `getSelectedObjects() => Promise<UpmadeBaseObject[]>`



#### Returns

Type: `Promise<UpmadeBaseObject<HTMLElement | SVGElement>[]>`



### `getViewport() => Promise<UpmadeViewportState>`



#### Returns

Type: `Promise<UpmadeViewportState>`



### `getWorkspaces() => Promise<UpmadeWorkspace[]>`



#### Returns

Type: `Promise<UpmadeWorkspace[]>`



### `group(objects: UpmadeBaseObject<any>[]) => Promise<UpmadeGroup | null>`



#### Parameters

| Name      | Type                      | Description |
| --------- | ------------------------- | ----------- |
| `objects` | `UpmadeBaseObject<any>[]` |             |

#### Returns

Type: `Promise<UpmadeGroup>`



### `hideContextMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `highlightObjectElements(objectId: string, highlights: UpmadeObjectElementHighlight[]) => Promise<void>`

Highlights elements inside an object's content, replacing its previous highlights.
Highlights are local: they are neither saved nor shown to collaborators.

#### Parameters

| Name         | Type                             | Description                                                                                     |
| ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `objectId`   | `string`                         | - The object ID.                                                                                |
| `highlights` | `UpmadeObjectElementHighlight[]` | - `{ selector, color?, label? }` entries. Every element that matches a selector is highlighted. |

#### Returns

Type: `Promise<void>`



### `importFromFile() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `importFromJson(json: string) => Promise<void>`



#### Parameters

| Name   | Type     | Description |
| ------ | -------- | ----------- |
| `json` | `string` |             |

#### Returns

Type: `Promise<void>`



### `loadObjectsFromJson(json: string) => Promise<number>`



#### Parameters

| Name   | Type     | Description |
| ------ | -------- | ----------- |
| `json` | `string` |             |

#### Returns

Type: `Promise<number>`



### `loadSharedWorkspace(token: string) => Promise<void>`



#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `token` | `string` |             |

#### Returns

Type: `Promise<void>`



### `openContextMenu(options: { x: number; y: number; objectId?: string; }) => Promise<void>`



#### Parameters

| Name      | Type                                           | Description |
| --------- | ---------------------------------------------- | ----------- |
| `options` | `{ x: number; y: number; objectId?: string; }` |             |

#### Returns

Type: `Promise<void>`



### `openExportDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openImportDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openLoginDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openMoreMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openSettingsDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openShareDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openUserDialog() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `openWorkspaceManagerMenu() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `panTo(x: number, y: number) => Promise<void>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `x`  | `number` |             |
| `y`  | `number` |             |

#### Returns

Type: `Promise<void>`



### `panToObject(object: UpmadeBaseObject) => Promise<void>`



#### Parameters

| Name     | Type                                          | Description |
| -------- | --------------------------------------------- | ----------- |
| `object` | `UpmadeBaseObject<HTMLElement \| SVGElement>` |             |

#### Returns

Type: `Promise<void>`



### `paste(x: number, y: number) => Promise<void>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `x`  | `number` |             |
| `y`  | `number` |             |

#### Returns

Type: `Promise<void>`



### `queryObjectElements(objectId: string, selector: string, limit?: number) => Promise<UpmadeObjectElementInfo[]>`

Describes the elements inside an object's content that match a CSS selector, in document order.
The object must be mounted, which it is while it is in or near the viewport.

#### Parameters

| Name       | Type     | Description                                                |
| ---------- | -------- | ---------------------------------------------------------- |
| `objectId` | `string` | - The object ID.                                           |
| `selector` | `string` | - A CSS selector, e.g. `'button'` or `'[data-upmade-id]'`. |
| `limit`    | `number` | - Maximum number of elements, 1 to 500. Defaults to 100.   |

#### Returns

Type: `Promise<UpmadeObjectElementInfo[]>`

The matching elements, each with a `selector` that can be used to highlight it or point an agent's cursor
at it with `agent.moveTo({ objectId, selector })`.

### `redo() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `registerFonts(fonts: UpmadeFontMap) => Promise<void>`

Registers custom fonts for the editor runtime.

#### Parameters

| Name    | Type                                       | Description                                                   |
| ------- | ------------------------------------------ | ------------------------------------------------------------- |
| `fonts` | `{ [x: string]: UpmadeFontRegistration; }` | - Mapping from font keys to family names or font definitions. |

#### Returns

Type: `Promise<void>`



### `registerLocales(locales: UpmadeLocale[]) => Promise<void>`

Registers additional locale definitions (with optional partial term overrides).

#### Parameters

| Name      | Type             | Description                           |
| --------- | ---------------- | ------------------------------------- |
| `locales` | `UpmadeLocale[]` | - The locale definitions to register. |

#### Returns

Type: `Promise<void>`



### `registerTool(toolName: string, toolClass: any, toolConfig?: UpmadeTextToolConfig | UpmadeBrushToolConfig | UpmadeLineToolConfig | UpmadeShapeToolConfig) => Promise<UpmadeBaseTool | null>`



#### Parameters

| Name         | Type                                                                                             | Description |
| ------------ | ------------------------------------------------------------------------------------------------ | ----------- |
| `toolName`   | `string`                                                                                         |             |
| `toolClass`  | `any`                                                                                            |             |
| `toolConfig` | `UpmadeTextToolConfig \| UpmadeBrushToolConfig \| UpmadeLineToolConfig \| UpmadeShapeToolConfig` |             |

#### Returns

Type: `Promise<UpmadeBaseTool>`



### `reinitSync() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `removeAgent(agent: UpmadeAgent | string) => Promise<boolean>`

Removes an agent: its running action is rolled back, its queued actions resolve with
`'agent-removed'`, and its cursor and history are dropped. The agent can be added again.

#### Parameters

| Name    | Type                    | Description            |
| ------- | ----------------------- | ---------------------- |
| `agent` | `string \| UpmadeAgent` | - The agent or its ID. |

#### Returns

Type: `Promise<boolean>`

`false` if the agent was not added.

### `removeObject<T extends UpmadeBaseObject>(object: T) => Promise<T | null>`



#### Parameters

| Name     | Type | Description |
| -------- | ---- | ----------- |
| `object` | `T`  |             |

#### Returns

Type: `Promise<T>`



### `removeObjects<T extends UpmadeBaseObject>(objects: T[]) => Promise<T[]>`



#### Parameters

| Name      | Type  | Description |
| --------- | ----- | ----------- |
| `objects` | `T[]` |             |

#### Returns

Type: `Promise<T[]>`



### `screenToWorld(x: number, y: number) => Promise<{ x: number; y: number; }>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `x`  | `number` |             |
| `y`  | `number` |             |

#### Returns

Type: `Promise<{ x: number; y: number; }>`



### `selectAllObjectsInViewport() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `selectObjects(objects: UpmadeBaseObject[]) => Promise<void>`



#### Parameters

| Name      | Type                                            | Description |
| --------- | ----------------------------------------------- | ----------- |
| `objects` | `UpmadeBaseObject<HTMLElement \| SVGElement>[]` |             |

#### Returns

Type: `Promise<void>`



### `sendBackward(object?: UpmadeBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                    | Description |
| -------- | ----------------------- | ----------- |
| `object` | `UpmadeBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `sendToBack(object?: UpmadeBaseObject<any>) => Promise<void>`



#### Parameters

| Name     | Type                    | Description |
| -------- | ----------------------- | ----------- |
| `object` | `UpmadeBaseObject<any>` |             |

#### Returns

Type: `Promise<void>`



### `setActiveTool(toolName: string) => Promise<void>`



#### Parameters

| Name       | Type     | Description |
| ---------- | -------- | ----------- |
| `toolName` | `string` |             |

#### Returns

Type: `Promise<void>`



### `setActiveWorkspace(id: string) => Promise<void>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `id` | `string` |             |

#### Returns

Type: `Promise<void>`



### `setLocale(code: LocaleCode) => Promise<void>`

Sets the active locale (language) and re-renders the UI.

#### Parameters

| Name   | Type                                    | Description                               |
| ------ | --------------------------------------- | ----------------------------------------- |
| `code` | `(string & {}) \| "en" \| "de" \| "fr"` | - The locale code to activate, e.g. 'de'. |

#### Returns

Type: `Promise<void>`



### `setLoginLoading(provider: string | null) => Promise<void>`



#### Parameters

| Name       | Type     | Description |
| ---------- | -------- | ----------- |
| `provider` | `string` |             |

#### Returns

Type: `Promise<void>`



### `setObjectElementPicking(objectId: string, enabled: boolean, options?: UpmadeObjectElementPickingOptions) => Promise<void>`

Turns element picking on or off for an object whose content has elements, such as an iframe object.
While picking, the element under the pointer is highlighted, and a click emits `objectElementPick`
instead of reaching the content. Picking works while the object is interactive, which it is while selected.

#### Parameters

| Name       | Type                                | Description                                                                         |
| ---------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `objectId` | `string`                            | - The object ID.                                                                    |
| `enabled`  | `boolean`                           | - Whether the object picks elements.                                                |
| `options`  | `UpmadeObjectElementPickingOptions` | - `selector` limits picking to matching elements, `color` sets the highlight color. |

#### Returns

Type: `Promise<void>`



### `setViewport(x: number, y: number, scale: number) => Promise<void>`



#### Parameters

| Name    | Type     | Description |
| ------- | -------- | ----------- |
| `x`     | `number` |             |
| `y`     | `number` |             |
| `scale` | `number` |             |

#### Returns

Type: `Promise<void>`



### `t(key: UpmadeTermKey, vars?: UpmadeTermVars) => Promise<string>`

Resolves a term key to its translated string for the active locale.

#### Parameters

| Name   | Type                                 | Description                                          |
| ------ | ------------------------------------ | ---------------------------------------------------- |
| `key`  | `keyof UpmadeTerms`                  | - The term key to resolve.                           |
| `vars` | `{ [x: string]: string \| number; }` | - Optional values for `{placeholder}` interpolation. |

#### Returns

Type: `Promise<string>`



### `triggerNotification(notification: Omit<UpmadeNotification, "id"> & Partial<Pick<UpmadeNotification, "id" | "timestamp">>) => Promise<void>`

Triggers a UI notification programmatically.

#### Parameters

| Name           | Type                                                                                      | Description                                                |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `notification` | `Omit<UpmadeNotification, "id"> & Partial<Pick<UpmadeNotification, "id" \| "timestamp">>` | - Notification payload. `id` and `timestamp` are optional. |

#### Returns

Type: `Promise<void>`



### `triggerSelectionChange() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `undo() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `ungroup(groups: UpmadeGroup[]) => Promise<UpmadeBaseObject<any>[]>`



#### Parameters

| Name     | Type            | Description |
| -------- | --------------- | ----------- |
| `groups` | `UpmadeGroup[]` |             |

#### Returns

Type: `Promise<UpmadeBaseObject<any>[]>`



### `updateObject<T extends UpmadeBaseObject>(object: T, updatedProperties: Partial<T>) => Promise<T | null>`



#### Parameters

| Name                | Type                         | Description |
| ------------------- | ---------------------------- | ----------- |
| `object`            | `T`                          |             |
| `updatedProperties` | `{ [P in keyof T]?: T[P]; }` |             |

#### Returns

Type: `Promise<T>`



### `updateWorkspace(workspace: UpmadeWorkspace) => Promise<void>`



#### Parameters

| Name        | Type              | Description |
| ----------- | ----------------- | ----------- |
| `workspace` | `UpmadeWorkspace` |             |

#### Returns

Type: `Promise<void>`



### `worldToScreen(x: number, y: number) => Promise<{ x: number; y: number; }>`



#### Parameters

| Name | Type     | Description |
| ---- | -------- | ----------- |
| `x`  | `number` |             |
| `y`  | `number` |             |

#### Returns

Type: `Promise<{ x: number; y: number; }>`



### `zoomIn(factor?: number, duration?: number) => Promise<void>`



#### Parameters

| Name       | Type     | Description |
| ---------- | -------- | ----------- |
| `factor`   | `number` |             |
| `duration` | `number` |             |

#### Returns

Type: `Promise<void>`



### `zoomOut(factor?: number, duration?: number) => Promise<void>`



#### Parameters

| Name       | Type     | Description |
| ---------- | -------- | ----------- |
| `factor`   | `number` |             |
| `duration` | `number` |             |

#### Returns

Type: `Promise<void>`



### `zoomTo(scale: number, worldX?: number, worldY?: number) => Promise<void>`



#### Parameters

| Name     | Type     | Description |
| -------- | -------- | ----------- |
| `scale`  | `number` |             |
| `worldX` | `number` |             |
| `worldY` | `number` |             |

#### Returns

Type: `Promise<void>`




## Dependencies

### Depends on

- [upmade-workspace-manager](../upmade-workspace-manager)
- [upmade-back-to-content](../upmade-back-to-content)
- [upmade-notification-card](../upmade-notification-card)
- [upmade-context-menu](../upmade-context-menu)
- [upmade-portal](../upmade-portal)
- [upmade-titlebar-menu](../upmade-titlebar-menu)
- upmade-engine
- [upmade-chat-box](../upmade-chat-box)
- [upmade-toolbar](../upmade-toolbar)
- [upmade-zoom-panel](../upmade-zoom-panel)
- [upmade-settings](../upmade-settings)
- [upmade-export](../upmade-export)
- [upmade-active-users](../upmade-active-users)
- [upmade-current-user](../upmade-current-user)
- [upmade-current-user-dialog](../upmade-current-user-dialog)
- [upmade-button](../upmade-button)
- [upmade-more-menu](../upmade-more-menu)
- [upmade-share-dialog](../upmade-share-dialog)
- [upmade-login-dialog](../upmade-login-dialog)

### Graph
```mermaid
graph TD;
  upmade-editor --> upmade-workspace-manager
  upmade-editor --> upmade-back-to-content
  upmade-editor --> upmade-notification-card
  upmade-editor --> upmade-context-menu
  upmade-editor --> upmade-portal
  upmade-editor --> upmade-titlebar-menu
  upmade-editor --> upmade-engine
  upmade-editor --> upmade-chat-box
  upmade-editor --> upmade-toolbar
  upmade-editor --> upmade-zoom-panel
  upmade-editor --> upmade-settings
  upmade-editor --> upmade-export
  upmade-editor --> upmade-active-users
  upmade-editor --> upmade-current-user
  upmade-editor --> upmade-current-user-dialog
  upmade-editor --> upmade-button
  upmade-editor --> upmade-more-menu
  upmade-editor --> upmade-share-dialog
  upmade-editor --> upmade-login-dialog
  upmade-workspace-manager --> upmade-split-button
  upmade-split-button --> upmade-icon
  upmade-split-button --> upmade-portal
  upmade-split-button --> upmade-menu
  upmade-menu --> upmade-menu-item
  upmade-menu-item --> upmade-icon
  upmade-menu-item --> upmade-portal
  upmade-back-to-content --> upmade-icon
  upmade-notification-card --> upmade-icon
  upmade-context-menu --> upmade-icon
  upmade-titlebar-menu --> upmade-menu
  upmade-engine --> upmade-icon
  upmade-engine --> upmade-object-titlebar-layer
  upmade-engine --> upmade-awareness-cursors
  upmade-engine --> upmade-agentic-cursors
  upmade-engine --> upmade-cursor-trail
  upmade-engine --> upmade-watermark
  upmade-object-titlebar-layer --> upmade-icon
  upmade-chat-box --> upmade-icon
  upmade-toolbar --> upmade-utility-panel
  upmade-toolbar --> upmade-icon
  upmade-toolbar --> upmade-tooltip
  upmade-toolbar --> upmade-tool-config
  upmade-toolbar --> upmade-color
  upmade-utility-panel --> upmade-icon
  upmade-tool-config --> upmade-stroke-size
  upmade-tool-config --> upmade-font-size
  upmade-tool-config --> upmade-line-endings
  upmade-tool-config --> upmade-shape-fill
  upmade-tool-config --> upmade-font-family
  upmade-tool-config --> upmade-color-palette
  upmade-tool-config --> upmade-opacity-slider
  upmade-tool-config --> upmade-icon
  upmade-stroke-size --> upmade-color
  upmade-font-size --> upmade-font
  upmade-font-family --> upmade-dropdown
  upmade-color-palette --> upmade-color
  upmade-zoom-panel --> upmade-icon
  upmade-settings --> upmade-dropdown
  upmade-settings --> upmade-slide-toggle
  upmade-settings --> upmade-numeric-input
  upmade-settings --> upmade-dialog
  upmade-settings --> upmade-master-detail
  upmade-master-detail --> upmade-icon
  upmade-export --> upmade-input
  upmade-export --> upmade-dropdown
  upmade-export --> upmade-dialog
  upmade-export --> upmade-pill-tabs
  upmade-pill-tabs --> upmade-icon
  upmade-active-users --> upmade-avatar
  upmade-current-user --> upmade-avatar
  upmade-current-user-dialog --> upmade-dialog
  upmade-current-user-dialog --> upmade-avatar
  upmade-current-user-dialog --> upmade-button
  upmade-more-menu --> upmade-icon
  upmade-more-menu --> upmade-portal
  upmade-more-menu --> upmade-menu
  upmade-share-dialog --> upmade-dialog
  upmade-share-dialog --> upmade-slide-toggle
  upmade-share-dialog --> upmade-icon
  upmade-login-dialog --> upmade-dialog
  upmade-login-dialog --> upmade-icon
  style upmade-editor fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
