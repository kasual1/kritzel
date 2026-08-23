import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

const INTERNAL_COMPONENTS = [
  'kritzel-brush-style',
  'kritzel-color',
  'kritzel-color-palette',
  'kritzel-context-menu',
  'kritzel-toolbar',
  'kritzel-cursor-trail',
  'kritzel-dropdown',
  'kritzel-font',
  'kritzel-font-family',
  'kritzel-font-size',
  'kritzel-icon',
  'kritzel-stroke-size',
  'kritzel-tool-config',
  'kritzel-tooltip',
  'kritzel-utility-panel',
  'kritzel-portal',
  'kritzel-menu',
  'kritzel-menu-item',
  'kritzel-split-button',
  'kritzel-workspace-manager',
  'kritzel-active-users',
  'kritzel-current-user',
  'kritzel-more-menu',
  'kritzel-avatar',
  'kritzel-active-users',
  'kritzel-share-dialog',
  'kritzel-slide-toggle',
  'kritzel-shape-fill'
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');

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
    { type: 'docs-readme' },
    { type: 'www', serviceWorker: null },
    { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
    angularOutputTarget({
      componentCorePackage: 'kritzel-stencil',
      directivesProxyFile: '../kritzel-angular/projects/lib/src/lib/proxy.ts',
      directivesArrayFile: '../kritzel-angular/projects/lib/src/lib/index.ts',
      outputType: 'standalone',
      customElementsDir: 'dist/components',
      excludeComponents: INTERNAL_COMPONENTS,
    }),
    reactOutputTarget({
      outDir: '../kritzel-react/lib/components/stencil-generated/',
      stencilPackageName: '../../../../kritzel-stencil',
      excludeComponents: INTERNAL_COMPONENTS,
    }),
    vueOutputTarget({
      componentCorePackage: '../../kritzel-stencil',
      proxiesFile: '../kritzel-vue/lib/components.ts',
      includeImportCustomElements: true,
      customElementsDir: 'dist/components',
      excludeComponents: INTERNAL_COMPONENTS,
    }),
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
