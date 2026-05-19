import { createRouter, createWebHistory } from 'vue-router'
import EditorPage from './pages/EditorPage.vue'
import MultiEditorPage from './pages/MultiEditorPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: EditorPage },
    { path: '/multi-editor', component: MultiEditorPage },
  ],
})
