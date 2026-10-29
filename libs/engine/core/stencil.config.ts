import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { resolve } from 'path';

const INTERNAL_COMPONENTS = [
  'kritzel-cursor-trail',
  'kritzel-icon',
  'kritzel-watermark',
  'kritzel-awareness-cursors',
  'kritzel-agentic-cursors',
  'kritzel-object-titlebar-layer',
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');
const isEditorDevBuild = process.env.npm_lifecycle_event === 'build:editor-dev';

export const config: Config = {
  namespace: 'stencil',
  // Ship non-minified ESM: pre-minified dist/components (adjacent top-level classes) breaks
  // @angular/build >= 22.1.0 advancedOptimizations (angular-cli#33699); consumers minify anyway
  minifyJs: false,
  // Exclude @kritzel/core, yjs and its dependencies from the bundle, as they will be loaded separately in the consuming application.
  // @kritzel/core holds every class, so all outputs (and the editor, which compiles these components) share one copy of them.
  // Bundling yjs would also make it throw a multiple import error
  ...(isDev
    ? {
        // Rebuild when `npm run dev -w libs/core` writes new output
        watchExternalDirs: [resolve(process.cwd(), '../../core/dist')],
      }
    : {
        rollupConfig: {
          inputOptions: {
            external: [/^@kritzel\/core(\/.*)?$/, /^(yjs|y-websocket|y-indexeddb|lib0)(\/.*)?$/],
          },
        },
      }),
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
            componentCorePackage: '@kritzel/engine',
            directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
            directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
            outputType: 'standalone',
            customElementsDir: 'dist/components',
            excludeComponents: INTERNAL_COMPONENTS,
          }),
          reactOutputTarget({
            outDir: '../react/lib/components/stencil-generated/',
            stencilPackageName: '@kritzel/engine',
            excludeComponents: INTERNAL_COMPONENTS,
          }),
          vueOutputTarget({
            componentCorePackage: '@kritzel/engine',
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
    // Specs run against @kritzel/core's source, so they don't need a core build. The `src/` alias is
    // test-only and lets specs mock single core modules with jest.mock('@kritzel/core/src/...').
    moduleNameMapper: {
      '^@kritzel/core$': '<rootDir>/../../core/src/index.ts',
      '^@kritzel/core/src/(.*)$': '<rootDir>/../../core/src/$1',
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
