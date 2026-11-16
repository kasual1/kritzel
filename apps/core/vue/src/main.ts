import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType } from '@upmade/vue-editor'
import { router } from './router'
import './index.css'

// Expose Upmade classes on window for Playwright e2e tests
(window as any).__upmade__ = { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType };

createApp(App).use(ComponentLibrary).use(router).mount('#app')
