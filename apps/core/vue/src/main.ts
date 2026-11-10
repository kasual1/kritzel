import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, KritzelIframeObject, ShapeType } from '@kritzel/vue-editor'
import { router } from './router'
import './index.css'

// Expose Kritzel classes on window for Playwright e2e tests
(window as any).__kritzel__ = { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, KritzelIframeObject, ShapeType };

createApp(App).use(ComponentLibrary).use(router).mount('#app')
