import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';

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
    angularOutputTarget({
      componentCorePackage: '@workspace/stencil',
      directivesProxyFile: '../../packages/angular/projects/lib/src/lib/proxy.ts',
      directivesArrayFile: '../../packages/angular/projects/lib/src/lib/index.ts',
      outputType: 'component'
    }),
    reactOutputTarget({
      outDir: '../react/lib/components/stencil-generated/',
      stencilPackageName: '../../../../stencil',
    }),
    { type: 'dist-custom-elements', externalRuntime: false },
  ],
  testing: {
    browserHeadless: "new",
  },
};
