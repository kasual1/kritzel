import { defineCustomElements } from '@kritzel/stencil/loader';
export const ComponentLibrary = {
    async install() {
        defineCustomElements();
    },
};
