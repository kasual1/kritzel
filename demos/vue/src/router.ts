import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'
import BasicUsagePage from './pages/basic-usage/BasicUsagePage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/e2e/editor' },
    {
      path: '/e2e',
      children: [
        { path: 'editor', component: EditorPage },
        { path: 'multi-editor', component: MultiEditorPage },
        { path: 'wrapped-editor', component: WrappedEditorPage },
      ],
    },
    {
      path: '/basic-usage',
      component: BasicUsagePage,
    },
    {
      path: '/examples',
      children: [
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/e2e/editor' },
  ],
})
