import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, ShapeType } from '@upmade/vue-editor'
import { router } from './router'
import './index.css'

// Expose Upmade classes on window for Playwright e2e tests
const e2eConstructors = { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, ShapeType }
const testWindow = window as Window & { __upmade__: typeof e2eConstructors }
testWindow.__upmade__ = e2eConstructors

createApp(App).use(ComponentLibrary).use(router).mount('#app')
