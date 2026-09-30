import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

const INTERNAL_COMPONENTS = [
  'kritzel-cursor-trail',
  'kritzel-icon',
  'kritzel-watermark',
  'kritzel-awareness-cursors',
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');
const isEditorDevBuild = process.env.npm_lifecycle_event === 'build:editor-dev';

export const config: Config = {
  namespace: 'stencil',
  // Ship non-minified ESM: pre-minified dist/components (adjacent top-level classes) breaks
  // @angular/build >= 22.1.0 advancedOptimizations (angular-cli#33699); consumers minify anyway
  minifyJs: false,
  // Exclude yjs and its dependencies from the bundle, as they will be loaded separately in the consuming application
  // Otherwise yjs will throw mulitple import error
  ...(isDev ? {} : {
    rollupConfig: {
      inputOptions: {
        external: ['yjs', 'y-websocket', 'y-indexeddb', 'lib0'],
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
    transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
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
