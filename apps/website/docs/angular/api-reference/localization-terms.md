---
sidebar_label: Localization Terms
displayed_sidebar: tutorialSidebar
title: "Localization Terms | Kritzel for Angular"
description: "Reference for all built-in localization keys and their default English text in Kritzel."
toc_max_heading_level: 4
---

# Localization Terms

This is the API reference for all built-in localization keys in Kritzel. Every key has a default English text that can be overridden by custom locales.

Override selected keys by providing a partial custom locale. Keys you omit continue to use the default English text.

```ts
import { KritzelLocale } from '@kritzel/angular-editor';

const customEnglish: KritzelLocale = {
	code: 'en',
	label: 'English',
	terms: {
		'menu.copy': 'Duplicate',
		'settings.dialogTitle': 'Preferences',
	},
};

customLocales: KritzelLocale[] = [customEnglish];
```

```html
<kritzel-editor [locales]="customLocales"></kritzel-editor>
```

## Built-in localization keys

### Context menu

| Key | Default text |
|------|--------------|
| menu.copy | Copy |
| menu.cut | Cut |
| menu.paste | Paste |
| menu.selectAll | Select All |
| menu.order | Order |
| menu.bringToFront | Bring to Front |
| menu.sendToBack | Send to Back |
| menu.moveUp | Move Up |
| menu.moveDown | Move Down |
| menu.align | Align |
| menu.alignLeft | Align Left |
| menu.alignCenterHorizontal | Align Center Horizontally |
| menu.alignRight | Align Right |
| menu.alignTop | Align Top |
| menu.alignCenterVertical | Align Center Vertically |
| menu.alignBottom | Align Bottom |
| menu.group | Group |
| menu.ungroup | Ungroup |
| menu.export | Export |
| menu.exportAsSvg | Export as SVG |
| menu.exportAsPng | Export as PNG |
| menu.delete | Delete |

### More menu

| Key | Default text |
|------|--------------|
| menu.share | Share |
| menu.import | Import |
| menu.settings | Settings |
| menu.logout | Logout |
| moreMenu.ariaLabel | More options |

### Settings dialog

#### General

| Key | Default text |
|------|--------------|
| settings.dialogTitle | Settings |
| settings.categories.general | General |
| settings.general.title | General Settings |
| settings.general.theme.label | Theme |
| settings.general.theme.description | Select a registered color theme for the editor interface. |
| settings.general.language.label | Language |
| settings.general.language.description | Select the display language for the editor interface. |
| settings.general.lockDrawingScale.label | Lock Drawing Scale |
| settings.general.lockDrawingScale.description | When enabled, drawn objects maintain a fixed visual size regardless of the current zoom level. |

#### Viewport

| Key | Default text |
|------|--------------|
| settings.categories.viewport | Viewport |
| settings.viewport.title | Viewport Settings |
| settings.viewport.minZoom.label | Minimum Zoom Level |
| settings.viewport.minZoom.description | Sets the minimum zoom level. Lower values allow zooming out further to see more of the canvas. |
| settings.viewport.maxZoom.label | Maximum Zoom Level |
| settings.viewport.maxZoom.description | Sets the maximum zoom level. Higher values allow zooming in closer for detailed work. |
| settings.viewport.boundaryLeft.label | Viewport Boundary Left |
| settings.viewport.boundaryLeft.description | Left boundary in world coordinates. Set to limit how far left the viewport can pan. |
| settings.viewport.boundaryRight.label | Viewport Boundary Right |
| settings.viewport.boundaryRight.description | Right boundary in world coordinates. Set to limit how far right the viewport can pan. |
| settings.viewport.boundaryTop.label | Viewport Boundary Top |
| settings.viewport.boundaryTop.description | Top boundary in world coordinates. Set to limit how far up the viewport can pan. |
| settings.viewport.boundaryBottom.label | Viewport Boundary Bottom |
| settings.viewport.boundaryBottom.description | Bottom boundary in world coordinates. Set to limit how far down the viewport can pan. |
| settings.viewport.boundaryPlaceholder | Infinite |

#### Shortcuts, developer options, and about

| Key | Default text |
|------|--------------|
| settings.categories.shortcuts | Keyboard Shortcuts |
| settings.shortcuts.title | Keyboard Shortcuts |
| settings.categories.developer | Developer Options |
| settings.developer.title | Developer Options |
| settings.developer.showViewportInfo.label | Show Viewport Info |
| settings.developer.showViewportInfo.description | Display viewport debug information such as position, zoom level, and boundaries. |
| settings.developer.showObjectInfo.label | Show Object Info |
| settings.developer.showObjectInfo.description | Display debug information about objects on the canvas. |
| settings.developer.showSyncProviderInfo.label | Show Sync Provider Info |
| settings.developer.showSyncProviderInfo.description | Display debug information about the sync provider connection status. |
| settings.developer.showMigrationInfo.label | Show Migration Info |
| settings.developer.showMigrationInfo.description | Display debug information about data migrations. |
| settings.categories.about | About |
| settings.about.title | About |
| settings.about.description | Kritzel - A drawing application |

### Export dialog

| Key | Default text |
|------|--------------|
| export.dialogTitle | Export |
| export.tabs.viewport | Export Viewport |
| export.tabs.workspace | Export Workspace |
| export.format.label | Format |
| export.filename.label | Filename |
| export.filename.placeholder | Enter filename |
| export.exportButton | Export |

### Workspace manager

| Key | Default text |
|------|--------------|
| workspace.sharedTooltip | Shared workspace |
| workspace.rename | Rename |
| workspace.delete | Delete |

### Zoom panel

| Key | Default text |
|------|--------------|
| zoom.zoomIn | Zoom in |
| zoom.zoomOut | Zoom out |

### Utility panel

| Key | Default text |
|------|--------------|
| utility.undo | Undo |
| utility.redo | Redo |
| utility.delete | Delete selected items |

### Share dialog

| Key | Default text |
|------|--------------|
| share.dialogTitle | Share Workspace |
| share.linkSharing.label | Link sharing |
| share.linkSharing.enabledDescription | Anyone with the link can access this workspace. |
| share.linkSharing.disabledDescription | Link sharing is disabled. Only you can access this workspace. |
| share.linkSharing.toggleLabel | Enable link sharing |
| share.copyLink.title | Copy link |
| share.copyLink.copied | Copied! |

### Login, user, and navigation

| Key | Default text |
|------|--------------|
| login.dialogTitle | Sign in |
| currentUser.dialogTitle | Account |
| backToContent.label | Back to content |

### Tool config and menu button

| Key | Default text |
|------|--------------|
| toolConfig.collapse | Collapse |
| toolConfig.expand | Expand |
| moreMenu.ariaLabel | More options |

### Watermark

| Key | Default text |
|------|--------------|
| watermark.poweredBy | Powered by Kritzel |

### Object type labels

Used as the default title of [object titlebars](../fundamentals/controls.md#object-titlebar) when an object has no `name`.

| Key | Default text |
|------|--------------|
| objectType.shape | Shape |
| objectType.text | Text |
| objectType.image | Image |
| objectType.path | Drawing |
| objectType.line | Line |
| objectType.group | Group |
| objectType.iframe | Embed |
| objectType.dynamic | Component |
| objectType.object | Object |
