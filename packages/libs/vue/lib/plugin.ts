import { Plugin } from 'vue';
import { applyPolyfills, defineCustomElements } from '@workspace/stencil/loader';

export const ComponentLibrary: Plugin = {
  async install() {
    applyPolyfills().then(() => {
      defineCustomElements();
    });
  },
};