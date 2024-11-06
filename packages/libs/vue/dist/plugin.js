import { applyPolyfills, defineCustomElements } from '@workspace/stencil/loader';
export const ComponentLibrary = {
    async install() {
        applyPolyfills().then(() => {
            defineCustomElements();
        });
    },
};
