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

export * from './classes/objects/text.class';
export * from './classes/objects/path.class';
export * from './classes/objects/image.class';
export * from './classes/objects/line.class';
export * from './classes/objects/group.class';
export * from './classes/objects/shape.class';

export * from './classes/tools/brush-tool.class';
export * from './classes/tools/line-tool.class';
export * from './classes/tools/eraser-tool.class';
export * from './classes/tools/image-tool.class';
export * from './classes/tools/text-tool.class';
export * from './classes/tools/shape-tool.class';

export * from './helpers/cursor.helper';
export * from './classes/tools/selection-tool.class';

export * from './classes/providers/broadcast-sync-provider.class';
export * from './classes/providers/indexeddb-sync-provider.class';
export * from './classes/providers/websocket-sync-provider.class';
export * from './classes/providers/hocuspocus-sync-provider.class';

export * from './classes/core/workspace.class';

export * from './classes/managers/anchor.manager';

export * from './interfaces/toolbar-control.interface';
export * from './interfaces/menu-item.interface';
export * from './interfaces/sync-provider.interface';
export * from './interfaces/sync-config.interface';
export * from './interfaces/login-config.interface';
export * from './interfaces/document-metadata.interface';
export * from './interfaces/anchor.interface';

export * from './configs/default-brush-tool.config';
export * from './configs/default-text-tool.config';
export * from './configs/default-line-tool.config';

export * from './interfaces/theme.interface';
export * from './interfaces/shortcut.interface';
export * from './themes/light-theme';
export * from './themes/dark-theme';
export * from './classes/managers/theme.manager';

export * from './enums/alignment.enum';
export * from './enums/shape-type.enum';

export * from './interfaces/viewport-state.interface';

export * from './interfaces/user.interface';