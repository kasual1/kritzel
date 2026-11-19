import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { resolve } from 'path';

const INTERNAL_COMPONENTS = [
  'upmade-active-users',
  'upmade-avatar',
  'upmade-back-to-content',
  'upmade-brush-style',
  'upmade-button',
  'upmade-color',
  'upmade-color-palette',
  'upmade-context-menu',
  'upmade-current-user',
  'upmade-current-user-dialog',
  'upmade-awareness-cursors',
  'upmade-agentic-cursors',
  'upmade-object-titlebar-layer',
  'upmade-dialog',
  'upmade-dropdown',
  'upmade-cursor-trail',
  'upmade-export',
  'upmade-font',
  'upmade-font-family',
  'upmade-font-size',
  'upmade-icon',
  'upmade-input',
  'upmade-line-endings',
  'upmade-login-dialog',
  'upmade-master-detail',
  'upmade-menu',
  'upmade-menu-item',
  'upmade-more-menu',
  'upmade-notification-card',
  'upmade-numeric-input',
  'upmade-opacity-slider',
  'upmade-pill-tabs',
  'upmade-portal',
  'upmade-slide-toggle',
  'upmade-titlebar-menu',
  'upmade-tool-config',
  'upmade-toolbar',
  'upmade-tooltip',
  'upmade-utility-panel',
  'upmade-watermark',
  'upmade-workspace-manager',
  'upmade-zoom-panel',
  'upmade-engine',
];

// Stencil has no `banner` option, so a Rollup plugin prepends it. Only the chunk holding the Stencil
// runtime gets it: every component loads that chunk and each output format has exactly one, so
// consumers see the notice once instead of once per component. `/*!` comments survive minification
// in consumers' bundlers, so the notice reaches production builds.
// First published in 2025; the range end follows the build date.
const YEAR = new Date().getFullYear();
const COPYRIGHT_YEARS = YEAR > 2025 ? `2025-${YEAR}` : '2025';
const BANNER = `/*!
 * @upmade/editor | MIT License | (c) ${COPYRIGHT_YEARS} Lukas Mühlenbeck
 * Like Upmade? Give it a star: https://github.com/kasual1/upmade
 */`;
const bannerPlugin = {
  name: 'upmade-banner',
  renderChunk: (code: string, chunk: { moduleIds: string[] }) =>
    chunk.moduleIds.some(id => id.includes('@stencil/core/internal/client'))
      ? { code: `${BANNER}\n${code}`, map: null }
      : null,
};

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');

export const config: Config = {
  namespace: 'upmade-editor',
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
            // (see the `import "@upmade/engine"` in upmade-editor.tsx). They and the editor import
            // every class from @upmade/core, so keep it external: the editor, the compiled engine
            // components and @upmade/engine then share one copy of each class.
            // Keep yjs and its companions external (as the engine build does), otherwise the
            // editor ships its own copy next to the one @upmade/engine imports and Yjs warns
            // "Yjs was already imported", breaking its constructor checks.
            external: [
              /^@upmade\/core(\/.*)?$/,
              '@upmade/engine',
              '@upmade/engine/loader',
              '@upmade/engine/dist/components',
              /^(yjs|y-websocket|y-indexeddb|lib0)(\/.*)?$/,
            ],
          },
        },
      }),
  rollupPlugins: { after: [bannerPlugin] },
  outputTargets: isDev
    ? [{ type: 'www', dir: '.stencil/www', serviceWorker: null }]
    : [
        { type: 'dist', esmLoaderPath: '../loader' },
        { type: 'docs-readme' },
        { type: 'docs-json', file: '.stencil/docs.json' },
        { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
        angularOutputTarget({
          componentCorePackage: '@upmade/editor',
          directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
          directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
          outputType: 'standalone',
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        reactOutputTarget({
          outDir: '../react/lib/components/stencil-generated/',
          stencilPackageName: '@upmade/editor',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        vueOutputTarget({
          componentCorePackage: '@upmade/editor',
          proxiesFile: '../vue/lib/components.ts',
          includeImportCustomElements: true,
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
      ],
  testing: {
    browserHeadless: 'shell',
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
    // Specs run against @upmade/core's source, so they don't need a core build.
    moduleNameMapper: {
      '^@upmade/core$': '<rootDir>/../../core/src/index.ts',
    },
    testPathIgnorePatterns: ['/node_modules/'],
    testRegex: ['(/__tests__/.*|(\\.|/)(spec|e2e))\\.(tsx?|ts?)$'],
  },
  extras: {
    enableImportInjection: true,
  },
};
