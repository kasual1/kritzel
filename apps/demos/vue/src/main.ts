import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary, UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, ShapeType } from '@updraw/vue-editor'
import { router } from './router'
import './index.css'

// Expose Updraw classes on window for Playwright e2e tests
const e2eConstructors = { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, ShapeType }
const testWindow = window as Window & { __updraw__: typeof e2eConstructors }
testWindow.__updraw__ = e2eConstructors

createApp(App).use(ComponentLibrary).use(router).mount('#app')
