import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, UpdrawIframeObject, ShapeType } from '@updraw/vue-editor'
import { router } from './router'
import './index.css'

// Expose Updraw classes on window for Playwright e2e tests
(window as any).__updraw__ = { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, UpdrawIframeObject, ShapeType };

createApp(App).use(ComponentLibrary).use(router).mount('#app')
