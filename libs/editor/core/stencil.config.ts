import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

const INTERNAL_COMPONENTS = [
  'kritzel-active-users',
  'kritzel-avatar',
  'kritzel-back-to-content',
  'kritzel-brush-style',
  'kritzel-button',
  'kritzel-color',
  'kritzel-color-palette',
  'kritzel-context-menu',
  'kritzel-current-user',
  'kritzel-current-user-dialog',
  'kritzel-awareness-cursors',
  'kritzel-dialog',
  'kritzel-dropdown',
  'kritzel-cursor-trail',
  'kritzel-export',
  'kritzel-font',
  'kritzel-font-family',
  'kritzel-font-size',
  'kritzel-icon',
  'kritzel-input',
  'kritzel-line-endings',
  'kritzel-loading-overlay',
  'kritzel-login-dialog',
  'kritzel-master-detail',
  'kritzel-menu',
  'kritzel-menu-item',
  'kritzel-more-menu',
  'kritzel-notification-card',
  'kritzel-numeric-input',
  'kritzel-opacity-slider',
  'kritzel-pill-tabs',
  'kritzel-portal',
  'kritzel-slide-toggle',
  'kritzel-tool-config',
  'kritzel-toolbar',
  'kritzel-tooltip',
  'kritzel-utility-panel',
  'kritzel-watermark',
  'kritzel-workspace-manager',
  'kritzel-zoom-panel',
  'kritzel-engine',
];

const isDev = process.argv.includes('--dev') || process.argv.includes('--serve');

export const config: Config = {
  namespace: 'kritzel-editor',
  minifyJs: false,
  ...(isDev
    ? {}
    : {
        rollupConfig: {
          inputOptions: {
            external: ['@kritzel/engine', '@kritzel/engine/loader', '@kritzel/engine/dist/components'],
          },
        },
      }),
  outputTargets: isDev
    ? [{ type: 'www', dir: '.stencil/www', serviceWorker: null }]
    : [
        { type: 'dist', esmLoaderPath: '../loader' },
        { type: 'docs-readme' },
        { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
        angularOutputTarget({
          componentCorePackage: '@kritzel/editor',
          directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
          directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
          outputType: 'standalone',
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        reactOutputTarget({
          outDir: '../react/lib/components/stencil-generated/',
          stencilPackageName: '@kritzel/editor',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
        vueOutputTarget({
          componentCorePackage: '@kritzel/editor',
          proxiesFile: '../vue/lib/components.ts',
          includeImportCustomElements: true,
          customElementsDir: 'dist/components',
          excludeComponents: INTERNAL_COMPONENTS,
        }),
      ],
  testing: {
    browserHeadless: 'shell',
    transform: { '^.+\\.(ts|tsx)$': 'ts-jest' },
    testPathIgnorePatterns: ['/node_modules/'],
    testRegex: ['(/__tests__/.*|(\\.|/)(spec|e2e))\\.(tsx?|ts?)$'],
  },
  extras: {
    enableImportInjection: true,
  },
};
