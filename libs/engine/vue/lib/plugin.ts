import { defineCustomElements } from '@kritzel/engine/loader';

export const ComponentLibrary: any = {
  async install() {
    defineCustomElements();
  },
};