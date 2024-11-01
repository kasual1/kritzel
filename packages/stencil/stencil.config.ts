import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';

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
      serviceWorker: null, // disable service workers
    },
    angularOutputTarget({
      componentCorePackage: '@workspace/stencil',
      directivesProxyFile: '../../packages/angular/projects/lib/src/lib/proxy.ts',
      directivesArrayFile: '../../packages/angular/projects/lib/src/lib/index.ts',
      outputType: 'component'
    }),
  ],
  testing: {
    browserHeadless: "new",
  },
};
