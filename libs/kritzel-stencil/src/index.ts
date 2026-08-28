/**
 * @fileoverview entry point for your component library
 *
 * This is the entry point for your component library. Use this file to export utilities,
 * constants or data structure that accompany your components.
 *
 * DO NOT use this file to export your components. Instead, use the recommended approaches
 * to consume components of this package as outlined in the `README.md`.
 */

export type * from './components';

export type HTMLKritzelEditorElement = HTMLElementTagNameMap['kritzel-editor'];
export type HTMLKritzelEngineElement = HTMLElementTagNameMap['kritzel-engine'];

export * from './classes/objects/base-object.class';
export * from './classes/objects/text.class';
export * from './classes/objects/path.class';
export * from './classes/objects/image.class';
export * from './classes/objects/line.class';
export * from './classes/objects/group.class';
export * from './classes/objects/shape.class';
export * from './classes/objects/dynamic-object.class';

export * from './classes/tools/base-tool.class';
export * from './classes/tools/brush-tool.class';
export * from './classes/tools/line-tool.class';
export * from './classes/tools/eraser-tool.class';
export * from './classes/tools/image-tool.class';
export * from './classes/tools/text-tool.class';
export * from './classes/tools/shape-tool.class';

export * from './helpers/cursor.helper';
export * from './classes/tools/selection-tool.class';

export * from './classes/providers/sync/broadcast-sync-provider.class';
export * from './classes/providers/sync/in-memory-sync-provider.class';
export * from './classes/providers/sync/indexeddb-sync-provider.class';
export * from './classes/providers/sync/websocket-sync-provider.class';
export * from './classes/providers/sync/hocuspocus-sync-provider.class';

export * from './classes/providers/assets/asset-resolver.class';
export * from './classes/providers/assets/indexeddb-asset-provider.class';
export * from './classes/providers/assets/http-asset-provider.class';
export * from './classes/providers/assets/presigned-asset-provider.class';

export * from './classes/core/workspace.class';

export * from './classes/managers/anchor.manager';
export * from './classes/managers/theme.manager';
export * from './classes/managers/localization.manager';
export * from './classes/managers/license.manager';

export * from './classes/registries/dynamic-object-renderer.registry';
export * from './classes/registries/font-registry.class';

export * from './interfaces/toolbar-item.interface';
export * from './interfaces/menu-item.interface';
export * from './interfaces/object-export.interface';
export * from './interfaces/object-change-event.interface';
export * from './interfaces/dynamic-object-renderer.interface';
export * from './interfaces/sync-provider.interface';
export * from './interfaces/sync-config.interface';
export * from './interfaces/asset.interface';
export * from './interfaces/asset-provider.interface';
export * from './interfaces/asset-storage-config.interface';
export * from './interfaces/login-config.interface';
export * from './interfaces/document-metadata.interface';
export * from './interfaces/anchor.interface';
export * from './interfaces/viewport-state.interface';
export * from './interfaces/context-menu-state.interface';
export * from './interfaces/user.interface';
export * from './interfaces/theme.interface';
export * from './interfaces/localization.interface';
export * from './interfaces/shortcut.interface';
export * from './interfaces/share.interface';
export * from './interfaces/engine-state.interface';
export * from './interfaces/debug-info.interface';
export * from './interfaces/bounding-box.interface';
export * from './interfaces/polygon.interface';
export * from './interfaces/font.interface';

export * from './configs/default-brush-tool.config';
export * from './configs/default-text-tool.config';
export * from './configs/default-line-tool.config';
export * from './configs/default-asset-storage.config';

export * from './themes/light-theme';
export * from './themes/dark-theme';

export * from './locales/en-locale';
export * from './locales/de-locale';
export * from './locales/fr-locale';

export * from './enums/alignment.enum';
export * from './enums/shape-type.enum';

export * from './interfaces/migration.interface';
export * from './helpers/migration.helper';
export * from './migrations/app-state.migrations';
export * from './migrations/workspace.migrations';

export * from './constants/schema.constants';

