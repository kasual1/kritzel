import { KritzelLocale } from '../interfaces/localization.interface';

/**
 * Built-in English locale (default). Provides a complete set of term values
 * that act as the ultimate fallback when other locales omit a key.
 */
export const EN_LOCALE: KritzelLocale = {
  code: 'en',
  label: 'English',
  terms: {
    // Context menu
    'menu.copy': 'Copy',
    'menu.cut': 'Cut',
    'menu.paste': 'Paste',
    'menu.selectAll': 'Select All',
    'menu.order': 'Order',
    'menu.bringToFront': 'Bring to Front',
    'menu.sendToBack': 'Send to Back',
    'menu.moveUp': 'Move Up',
    'menu.moveDown': 'Move Down',
    'menu.align': 'Align',
    'menu.alignLeft': 'Align Left',
    'menu.alignCenterHorizontal': 'Align Center Horizontally',
    'menu.alignRight': 'Align Right',
    'menu.alignTop': 'Align Top',
    'menu.alignCenterVertical': 'Align Center Vertically',
    'menu.alignBottom': 'Align Bottom',
    'menu.group': 'Group',
    'menu.ungroup': 'Ungroup',
    'menu.export': 'Export',
    'menu.exportAsSvg': 'Export as SVG',
    'menu.exportAsPng': 'Export as PNG',
    'menu.delete': 'Delete',

    // More menu
    'menu.share': 'Share',
    'menu.import': 'Import',
    'menu.settings': 'Settings',
    'menu.logout': 'Logout',

    // Settings dialog
    'settings.dialogTitle': 'Settings',
    'settings.categories.general': 'General',
    'settings.categories.viewport': 'Viewport',
    'settings.categories.shortcuts': 'Keyboard Shortcuts',
    'settings.categories.developer': 'Developer Options',
    'settings.categories.about': 'About',
    'settings.general.title': 'General Settings',
    'settings.general.theme.label': 'Theme',
    'settings.general.theme.description': 'Select a registered color theme for the editor interface.',
    'settings.general.language.label': 'Language',
    'settings.general.language.description': 'Select the display language for the editor interface.',
    'settings.general.lockDrawingScale.label': 'Lock Drawing Scale',
    'settings.general.lockDrawingScale.description': 'When enabled, drawn objects maintain a fixed visual size regardless of the current zoom level.',
    'settings.viewport.title': 'Viewport Settings',
    'settings.viewport.minZoom.label': 'Minimum Zoom Level',
    'settings.viewport.minZoom.description': 'Sets the minimum zoom level. Lower values allow zooming out further to see more of the canvas.',
    'settings.viewport.maxZoom.label': 'Maximum Zoom Level',
    'settings.viewport.maxZoom.description': 'Sets the maximum zoom level. Higher values allow zooming in closer for detailed work.',
    'settings.viewport.boundaryLeft.label': 'Viewport Boundary Left',
    'settings.viewport.boundaryLeft.description': 'Left boundary in world coordinates. Set to limit how far left the viewport can pan.',
    'settings.viewport.boundaryRight.label': 'Viewport Boundary Right',
    'settings.viewport.boundaryRight.description': 'Right boundary in world coordinates. Set to limit how far right the viewport can pan.',
    'settings.viewport.boundaryTop.label': 'Viewport Boundary Top',
    'settings.viewport.boundaryTop.description': 'Top boundary in world coordinates. Set to limit how far up the viewport can pan.',
    'settings.viewport.boundaryBottom.label': 'Viewport Boundary Bottom',
    'settings.viewport.boundaryBottom.description': 'Bottom boundary in world coordinates. Set to limit how far down the viewport can pan.',
    'settings.viewport.boundaryPlaceholder': 'Infinite',
    'settings.shortcuts.title': 'Keyboard Shortcuts',
    'settings.developer.title': 'Developer Options',
    'settings.developer.showViewportInfo.label': 'Show Viewport Info',
    'settings.developer.showViewportInfo.description': 'Display viewport debug information such as position, zoom level, and boundaries.',
    'settings.developer.showObjectInfo.label': 'Show Object Info',
    'settings.developer.showObjectInfo.description': 'Display debug information about objects on the canvas.',
    'settings.developer.showSyncProviderInfo.label': 'Show Sync Provider Info',
    'settings.developer.showSyncProviderInfo.description': 'Display debug information about the sync provider connection status.',
    'settings.developer.showMigrationInfo.label': 'Show Migration Info',
    'settings.developer.showMigrationInfo.description': 'Display debug information about data migrations.',
    'settings.about.title': 'About',
    'settings.about.description': 'Kritzel - A drawing application',

    // Export dialog
    'export.dialogTitle': 'Export',
    'export.tabs.viewport': 'Export Viewport',
    'export.tabs.workspace': 'Export Workspace',
    'export.format.label': 'Format',
    'export.filename.label': 'Filename',
    'export.filename.placeholder': 'Enter filename',
    'export.exportButton': 'Export',

    // Workspace manager
    'workspace.sharedTooltip': 'Shared workspace',
    'workspace.rename': 'Rename',
    'workspace.delete': 'Delete',

    // Zoom panel
    'zoom.zoomIn': 'Zoom in',
    'zoom.zoomOut': 'Zoom out',

    // Chat box
    'chatBox.placeholder': 'Ask the AI...',
    'chatBox.submit': 'Send',
    'chatBox.stop': 'Stop',

    // Utility panel
    'utility.undo': 'Undo',
    'utility.redo': 'Redo',
    'utility.delete': 'Delete selected items',

    // Share dialog
    'share.dialogTitle': 'Share Workspace',
    'share.linkSharing.label': 'Link sharing',
    'share.linkSharing.enabledDescription': 'Anyone with the link can access this workspace.',
    'share.linkSharing.disabledDescription': 'Link sharing is disabled. Only you can access this workspace.',
    'share.linkSharing.toggleLabel': 'Enable link sharing',
    'share.copyLink.title': 'Copy link',
    'share.copyLink.copied': 'Copied!',

    // Login dialog
    'login.dialogTitle': 'Sign in',

    // Current user dialog
    'currentUser.dialogTitle': 'Account',

    // Back to content
    'backToContent.label': 'Back to content',

    // Tool config
    'toolConfig.collapse': 'Collapse',
    'toolConfig.expand': 'Expand',

    // More menu button
    'moreMenu.ariaLabel': 'More options',

    // Editor
    'editor.loading': 'Loading...',

    // Watermark
    'watermark.poweredBy': 'Powered by Kritzel',
  },
};
