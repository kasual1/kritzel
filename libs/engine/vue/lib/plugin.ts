import { defineCustomElements } from '@updraw/engine/loader';

export const ComponentLibrary: any = {
  async install() {
    defineCustomElements();
  },
};