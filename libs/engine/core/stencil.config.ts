import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { resolve } from 'path';

const INTERNAL_COMPONENTS = [
  'upmade-cursor-trail',
  'upmade-icon',
  'upmade-watermark',
  'upmade-awareness-cursors',
  'upmade-agentic-cursors',
  'upmade-object-titlebar-layer',
];

// Stencil has no `banner` option, so a Rollup plugin prepends it. Only the chunk holding the Stencil
// runtime gets it: every component loads that chunk and each output format has exactly one, so
// consumers see the notice once instead of once per component. `/*!` comments survive minification
// in consumers' bundlers, so the notice reaches production builds.
const BANNER = `/*!
 * @upmade/engine | MIT License | (c) 2025 Lukas Mühlenbeck
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
const isEditorDevBuild = process.env.npm_lifecycle_event === 'build:editor-dev';

export const config: Config = {
  namespace: 'stencil',
  // Ship non-minified ESM: pre-minified dist/components (adjacent top-level classes) breaks
  // @angular/build >= 22.1.0 advancedOptimizations (angular-cli#33699); consumers minify anyway
  minifyJs: false,
  // Exclude @upmade/core, yjs and its dependencies from the bundle, as they will be loaded separately in the consuming application.
  // @upmade/core holds every class, so all outputs (and the editor, which compiles these components) share one copy of them.
  // Bundling yjs would also make it throw a multiple import error
  ...(isDev
    ? {
        // Rebuild when `npm run dev -w libs/core` writes new output
        watchExternalDirs: [resolve(process.cwd(), '../../core/dist')],
      }
    : {
        rollupConfig: {
          inputOptions: {
            external: [/^@upmade\/core(\/.*)?$/, /^(yjs|y-websocket|y-indexeddb|lib0)(\/.*)?$/],
          },
        },
      }),
  rollupPlugins: { after: [bannerPlugin] },
  outputTargets: [
    { type: 'dist', esmLoaderPath: '../loader' },
    { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
    ...(isEditorDevBuild
      ? []
      : [
          { type: 'docs-readme' as const },
          { type: 'docs-json' as const, file: '.stencil/docs.json' },
          { type: 'www' as const, serviceWorker: null },
          angularOutputTarget({
            componentCorePackage: '@upmade/engine',
            directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
            directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
            outputType: 'standalone',
            customElementsDir: 'dist/components',
            excludeComponents: INTERNAL_COMPONENTS,
          }),
          reactOutputTarget({
            outDir: '../react/lib/components/stencil-generated/',
            stencilPackageName: '@upmade/engine',
            excludeComponents: INTERNAL_COMPONENTS,
          }),
          vueOutputTarget({
            componentCorePackage: '@upmade/engine',
            proxiesFile: '../vue/lib/components.ts',
            includeImportCustomElements: true,
            customElementsDir: 'dist/components',
            excludeComponents: INTERNAL_COMPONENTS,
          }),
        ]),
  ],
  testing: {
    browserHeadless: 'shell',
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }] },
    // Specs run against @upmade/core's source, so they don't need a core build. The `src/` alias is
    // test-only and lets specs mock single core modules with jest.mock('@upmade/core/src/...').
    moduleNameMapper: {
      '^@upmade/core$': '<rootDir>/../../core/src/index.ts',
      '^@upmade/core/src/(.*)$': '<rootDir>/../../core/src/$1',
    },
    setupFiles: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['/node_modules/'],
    testRegex: ['(/__tests__/.*|(\\.|/)(spec|e2e))\\.(tsx?|ts?)$'],
    emulate: [
      {
        userAgent: 'default',
        viewport: {
          width: 1280,
          height: 720,
        },
      },
    ],
  },
  extras: {
    enableImportInjection: true,
  },
};
