import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { resolve } from 'path';

const INTERNAL_COMPONENTS = [
  'updraw-active-users',
  'updraw-avatar',
  'updraw-back-to-content',
  'updraw-brush-style',
  'updraw-button',
  'updraw-color',
  'updraw-color-palette',
  'updraw-context-menu',
  'updraw-current-user',
  'updraw-current-user-dialog',
  'updraw-awareness-cursors',
  'updraw-agentic-cursors',
  'updraw-object-titlebar-layer',
  'updraw-dialog',
  'updraw-dropdown',
  'updraw-cursor-trail',
  'updraw-export',
  'updraw-font',
  'updraw-font-family',
  'updraw-font-size',
  'updraw-icon',
  'updraw-input',
  'updraw-line-endings',
  'updraw-login-dialog',
  'updraw-master-detail',
  'updraw-menu',
  'updraw-menu-item',
  'updraw-more-menu',
  'updraw-notification-card',
  'updraw-numeric-input',
  'updraw-opacity-slider',
  'updraw-pill-tabs',
  'updraw-portal',
  'updraw-slide-toggle',
  'updraw-titlebar-menu',
  'updraw-tool-config',
  'updraw-toolbar',
  'updraw-tooltip',
  'updraw-utility-panel',
  'updraw-watermark',
  'updraw-workspace-manager',
  'updraw-zoom-panel',
  'updraw-engine',
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');

export const config: Config = {
  namespace: 'updraw-editor',
  minifyJs: false,
  ...(isDev
    ? {
        // Rebuild when `npm run dev -w libs/core` writes new output
        watchExternalDirs: [resolve(process.cwd(), '../../core/dist')],
      }
    : {
        rollupConfig: {
          inputOptions: {
            // The engine's components are compiled into this bundle from its Stencil collection
            // (see the `import "@updraw/engine"` in updraw-editor.tsx). They and the editor import
            // every class from @updraw/core, so keep it external: the editor, the compiled engine
            // components and @updraw/engine then share one copy of each class.
            // Keep yjs and its companions external (as the engine build does), otherwise the
            // editor ships its own copy next to the one @updraw/engine imports and Yjs warns
            // "Yjs was already imported", breaking its constructor checks.
            external: [
              /^@updraw\/core(\/.*)?$/,
              '@updraw/engine',
              '@updraw/engine/loader',
              '@updraw/engine/dist/components',
              /^(yjs|y-websocket|y-indexeddb|lib0)(\/.*)?$/,
            ],
          },
        },
      }),
  outputTargets: isDev
    ? [{ type: 'www', dir: '.stencil/www', serviceWorker: null }]
    : [
        { type: 'dist', esmLoaderPath: '../loader' },
        { type: 'docs-readme' },
        { type: 'docs-json', file: '.stencil/docs.json' },
        { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
        angularOutputTarget({
          componentCorePackage: '@updraw/editor',
          directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
          directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
          outputType: 'standalone',
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        reactOutputTarget({
          outDir: '../react/lib/components/stencil-generated/',
          stencilPackageName: '@updraw/editor',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        vueOutputTarget({
          componentCorePackage: '@updraw/editor',
          proxiesFile: '../vue/lib/components.ts',
          includeImportCustomElements: true,
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
      ],
  testing: {
    browserHeadless: 'shell',
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
    // Specs run against @updraw/core's source, so they don't need a core build.
    moduleNameMapper: {
      '^@updraw/core$': '<rootDir>/../../core/src/index.ts',
    },
    testPathIgnorePatterns: ['/node_modules/'],
    testRegex: ['(/__tests__/.*|(\\.|/)(spec|e2e))\\.(tsx?|ts?)$'],
  },
  extras: {
    enableImportInjection: true,
  },
};
