import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

const INTERNAL_COMPONENTS = [
  'kritzel-brush-style',
  'kritzel-color',
  'kritzel-color-palette',
  'kritzel-context-menu',
  'kritzel-control-brush-config',
  'kritzel-control-text-config',
  'kritzel-controls',
  'kritzel-cursor-trail',
  'kritzel-dropdown',
  'kritzel-engine',
  'kritzel-font',
  'kritzel-font-family',
  'kritzel-font-size',
  'kritzel-icon',
  'kritzel-stroke-size',
  'kritzel-tooltip',
  'kritzel-utility-panel',
];

export const config: Config = {
  namespace: 'stencil',
  outputTargets: [
    { type: 'dist', esmLoaderPath: '../loader' },
    { type: 'docs-readme' },
    { type: 'www', serviceWorker: null },
    { type: 'dist-custom-elements', externalRuntime: false, customElementsExportBehavior: 'single-export-module' },
    angularOutputTarget({
      componentCorePackage: 'kritzel-stencil',
      directivesProxyFile: '../kritzel-angular/projects/lib/src/lib/proxy.ts',
      directivesArrayFile: '../kritzel-angular/projects/lib/src/lib/index.ts',
      outputType: 'component',
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
  testing: { browserHeadless: 'shell' },
  extras: {
    enableImportInjection: true,
  },
};
