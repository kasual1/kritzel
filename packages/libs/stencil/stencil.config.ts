import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

export const config: Config = {
  namespace: 'stencil',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
    {
      type: 'www',
      serviceWorker: null,
    },
    { type: 'dist-custom-elements', externalRuntime: false },
    angularOutputTarget({
      componentCorePackage: '@workspace/stencil',
      directivesProxyFile: '../angular/projects/lib/src/lib/proxy.ts',
      directivesArrayFile: '../angular/projects/lib/src/lib/index.ts',
      outputType: 'component'
    }),
    reactOutputTarget({
      outDir: '../react/lib/components/stencil-generated/',
      stencilPackageName: '../../../../stencil',
    }),
    vueOutputTarget({
      componentCorePackage: '@workspace/stencil',
      proxiesFile: '../vue/lib/components.ts',
    }),
  ],
  testing: {
    browserHeadless: "new",
  },
};
