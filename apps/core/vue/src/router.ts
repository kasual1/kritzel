import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import EditorHocuspocusPage from './pages/e2e/EditorHocuspocusPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/e2e/editor' },
    {
      path: '/e2e',
      children: [
        { path: 'editor', component: EditorPage },
        { path: 'editor-hocuspocus', component: EditorHocuspocusPage },
        { path: 'multi-editor', component: MultiEditorPage },
        { path: 'wrapped-editor', component: WrappedEditorPage },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/e2e/editor' },
  ],
})
