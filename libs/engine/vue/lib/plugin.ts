import { defineCustomElements } from '@upmade/engine/loader';

export const ComponentLibrary: any = {
  async install() {
    defineCustomElements();
  },
};