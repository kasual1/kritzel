import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/EditorPage.vue'
import MultiEditorPage from './pages/MultiEditorPage.vue'
import CustomToolbar1Page from './pages/CustomToolbar1Page.vue'
import CustomToolbar2Page from './pages/CustomToolbar2Page.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/e2e' },
    {
      path: '/e2e',
      children: [
        { path: '', component: EditorPage },
        { path: 'multi-editor', component: MultiEditorPage },
      ],
    },
    {
      path: '/examples',
      children: [
        { path: 'custom-toolbar-1', component: CustomToolbar1Page },
        { path: 'custom-toolbar-2', component: CustomToolbar2Page },
      ],
    },
  ],
})
