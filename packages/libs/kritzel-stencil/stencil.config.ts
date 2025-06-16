import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = {
  namespace: 'stencil',
  globalStyle: 'src/global.css',
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
    }),
    reactOutputTarget({ outDir: '../kritzel-react/lib/components/stencil-generated/', stencilPackageName: '../../../../kritzel-stencil' }),
    vueOutputTarget({ componentCorePackage: '../../kritzel-stencil', proxiesFile: '../kritzel-vue/lib/components.ts', includeImportCustomElements: true, customElementsDir: 'dist/components' }),
  ],
  testing: { browserHeadless: true },
  extras: {
    enableImportInjection: true,
  },
  
};
