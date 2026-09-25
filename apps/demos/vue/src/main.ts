import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, ShapeType } from '@kritzel/vue-editor'
import { router } from './router'
import './index.css'

// Expose Kritzel classes on window for Playwright e2e tests
const e2eConstructors = { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, ShapeType }
const testWindow = window as Window & { __kritzel__: typeof e2eConstructors }
testWindow.__kritzel__ = e2eConstructors

createApp(App).use(ComponentLibrary).use(router).mount('#app')
