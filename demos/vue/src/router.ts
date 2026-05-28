import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'
import CustomToolbar1Page from './pages/examples/CustomToolbar1Page.vue'
import CustomToolbar2Page from './pages/examples/CustomToolbar2Page.vue'

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
      path: '/examples',
      children: [
        { path: 'custom-toolbar-1', component: CustomToolbar1Page },
        { path: 'custom-toolbar-2', component: CustomToolbar2Page },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/e2e/editor' },
  ],
})
