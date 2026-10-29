/**
 * Canonical locale identifier type for available locales.
 * Locales are identified by their code (e.g. 'en', 'de', 'fr').
 * The union is open so consumers can register additional locale codes.
 */
export type LocaleCode = 'en' | 'de' | 'fr' | (string & NonNullable<unknown>);

/**
 * Typed map of all known user-visible UI term keys to their translated strings.
 *
 * Keys are namespaced with a dotted prefix (e.g. `menu.copy`, `settings.title`)
 * to group related strings. Using a closed interface gives full compile-time
 * safety: typos in term keys are caught by the compiler and editors can
 * autocomplete the available keys.
 */
export interface KritzelTerms {
  // Context menu
  'menu.copy': string;
  'menu.cut': string;
  'menu.paste': string;
  'menu.selectAll': string;
  'menu.order': string;
  'menu.bringToFront': string;
  'menu.sendToBack': string;
  'menu.moveUp': string;
  'menu.moveDown': string;
  'menu.align': string;
  'menu.alignLeft': string;
  'menu.alignCenterHorizontal': string;
  'menu.alignRight': string;
  'menu.alignTop': string;
  'menu.alignCenterVertical': string;
  'menu.alignBottom': string;
  'menu.group': string;
  'menu.ungroup': string;
  'menu.export': string;
  'menu.exportAsSvg': string;
  'menu.exportAsPng': string;
  'menu.delete': string;

  // More menu
  'menu.share': string;
  'menu.import': string;
  'menu.settings': string;
  'menu.logout': string;

  // Settings dialog
  'settings.dialogTitle': string;
  'settings.categories.general': string;
  'settings.categories.viewport': string;
  'settings.categories.shortcuts': string;
  'settings.categories.developer': string;
  'settings.categories.about': string;
  'settings.general.title': string;
  'settings.general.theme.label': string;
  'settings.general.theme.description': string;
  'settings.general.language.label': string;
  'settings.general.language.description': string;
  'settings.general.lockDrawingScale.label': string;
  'settings.general.lockDrawingScale.description': string;
  'settings.viewport.title': string;
  'settings.viewport.minZoom.label': string;
  'settings.viewport.minZoom.description': string;
  'settings.viewport.maxZoom.label': string;
  'settings.viewport.maxZoom.description': string;
  'settings.viewport.boundaryLeft.label': string;
  'settings.viewport.boundaryLeft.description': string;
  'settings.viewport.boundaryRight.label': string;
  'settings.viewport.boundaryRight.description': string;
  'settings.viewport.boundaryTop.label': string;
  'settings.viewport.boundaryTop.description': string;
  'settings.viewport.boundaryBottom.label': string;
  'settings.viewport.boundaryBottom.description': string;
  'settings.viewport.boundaryPlaceholder': string;
  'settings.shortcuts.title': string;
  'settings.developer.title': string;
  'settings.developer.showViewportInfo.label': string;
  'settings.developer.showViewportInfo.description': string;
  'settings.developer.showObjectInfo.label': string;
  'settings.developer.showObjectInfo.description': string;
  'settings.developer.showSyncProviderInfo.label': string;
  'settings.developer.showSyncProviderInfo.description': string;
  'settings.developer.showMigrationInfo.label': string;
  'settings.developer.showMigrationInfo.description': string;
  'settings.about.title': string;
  'settings.about.description': string;

  // Export dialog
  'export.dialogTitle': string;
  'export.tabs.viewport': string;
  'export.tabs.workspace': string;
  'export.format.label': string;
  'export.filename.label': string;
  'export.filename.placeholder': string;
  'export.exportButton': string;

  // Workspace manager
  'workspace.sharedTooltip': string;
  'workspace.rename': string;
  'workspace.delete': string;

  // Zoom panel
  'zoom.zoomIn': string;
  'zoom.zoomOut': string;

  // Chat box
  'chatBox.placeholder': string;
  'chatBox.submit': string;
  'chatBox.stop': string;

  // Utility panel
  'utility.undo': string;
  'utility.redo': string;
  'utility.delete': string;

  // Share dialog
  'share.dialogTitle': string;
  'share.linkSharing.label': string;
  'share.linkSharing.enabledDescription': string;
  'share.linkSharing.disabledDescription': string;
  'share.linkSharing.toggleLabel': string;
  'share.copyLink.title': string;
  'share.copyLink.copied': string;

  // Login dialog
  'login.dialogTitle': string;

  // Current user dialog
  'currentUser.dialogTitle': string;

  // Back to content
  'backToContent.label': string;

  // Tool config
  'toolConfig.collapse': string;
  'toolConfig.expand': string;

  // More menu button
  'moreMenu.ariaLabel': string;

  // Watermark
  'watermark.poweredBy': string;

  // Object type labels (default titlebar titles)
  'objectType.shape': string;
  'objectType.text': string;
  'objectType.image': string;
  'objectType.path': string;
  'objectType.line': string;
  'objectType.group': string;
  'objectType.iframe': string;
  'objectType.dynamic': string;
  'objectType.object': string;
}

/**
 * A localization key. Restricted to the known {@link KritzelTerms} keys so that
 * lookups are validated at compile time.
 */
export type KritzelTermKey = keyof KritzelTerms;

/**
 * Definition of a single locale.
 *
 * `terms` is a `Partial<KritzelTerms>`, so a locale may override only a subset
 * of the available terms. Any missing term is resolved through the fallback
 * chain (see {@link KritzelLocalizationManager}). This mirrors the theming API,
 * allowing consumers to spread a built-in locale and override specific keys:
 *
 * ```ts
 * const myDe: KritzelLocale = {
 *   code: 'de',
 *   terms: { ...DE_LOCALE.terms, 'menu.copy': 'Duplizieren' },
 * };
 * ```
 */
export interface KritzelLocale {
  /** Canonical locale code, e.g. 'en', 'de', 'fr'. */
  code: LocaleCode;
  /** Optional human-readable display name shown in the language selector, e.g. 'Deutsch'. */
  label?: string;
  /** Partial map of term keys to translated strings. Missing keys fall back. */
  terms: Partial<KritzelTerms>;
}

/**
 * Values used to interpolate `{placeholder}` tokens inside a translated term.
 */
export type KritzelTermVars = Record<string, string | number>;
