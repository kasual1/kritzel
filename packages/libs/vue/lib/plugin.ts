import { defineCustomElements } from '@workspace/stencil/loader';

export const ComponentLibrary: any = {
  async install() {
    defineCustomElements();
  },
};