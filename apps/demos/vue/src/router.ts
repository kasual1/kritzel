import { createRouter, createWebHashHistory } from 'vue-router'
import { demoRoutes } from './demo-routes'
import DemoIndexPage from './pages/DemoIndexPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/getting-started/quick-start' },
    { path: '/demos', component: DemoIndexPage },
    ...demoRoutes.map(({ path, component }) => ({ path, component })),
    { path: '/:pathMatch(.*)*', redirect: '/getting-started/quick-start' },
  ],
})
