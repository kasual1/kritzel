import { defineCustomElements } from 'kritzel-stencil/loader';

export const ComponentLibrary: any = {
  async install() {
    defineCustomElements();
  },
};