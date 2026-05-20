import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, KritzelPath, KritzelImage, KritzelText } from 'kritzel-vue'
import { KritzelLine, KritzelShape, KritzelGroup, ShapeType } from 'kritzel-stencil'
import { router } from './router'
import './index.css'

// Expose Kritzel classes on window for Playwright e2e tests
(window as any).__kritzel__ = { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, ShapeType };

createApp(App).use(ComponentLibrary).use(router).mount('#app')
