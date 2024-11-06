import { defineCustomElements } from '@workspace/stencil/loader';
export const ComponentLibrary = {
    async install() {
        defineCustomElements();
    },
};
