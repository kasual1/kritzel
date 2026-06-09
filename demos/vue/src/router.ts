import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'
import BasicUsagePage from './pages/basic-usage/BasicUsagePage.vue'
import CollaborationLocalPage from './pages/concepts/collaboration/collaboration-local.vue'
import CollaborationRealtimePage from './pages/concepts/collaboration/collaboration-realtime.vue'
import ComponentsEditorPage from './pages/concepts/components/components-editor.vue'
import ComponentsEditorUiPage from './pages/concepts/components/components-editor-ui.vue'
import ComponentsEnginePage from './pages/concepts/components/components-engine.vue'
import CustomContextMenuCanvasQuickActionsPage from './pages/concepts/context-menus/custom-context-menu-canvas-quick-actions.vue'
import CustomContextMenuClipboardActionsPage from './pages/concepts/context-menus/custom-context-menu-clipboard-actions.vue'
import CustomContextMenuSmartConditionalPage from './pages/concepts/context-menus/custom-context-menu-smart-conditional.vue'
import CustomContextMenuObjectInspectorPage from './pages/concepts/context-menus/custom-context-menu-object-inspector.vue'
import ObjectsAddRemovePage from './pages/concepts/objects/objects-add-remove.vue'
import ObjectsQueryPage from './pages/concepts/objects/objects-query.vue'
import ObjectsSelectionPage from './pages/concepts/objects/objects-selection.vue'
import ObjectsGroupingPage from './pages/concepts/objects/objects-grouping.vue'
import ObjectsOrderingPage from './pages/concepts/objects/objects-ordering.vue'
import PersistenceLocalPage from './pages/concepts/persistence/persistence-local.vue'
import ThemingApplyPage from './pages/concepts/theming/theming-apply.vue'
import ThemingCustomPage from './pages/concepts/theming/theming-custom.vue'
import ToolsDisablePage from './pages/concepts/tools/tools-disable.vue'
import ToolsControlsPage from './pages/concepts/tools/tools-controls.vue'
import ToolsRegisterPage from './pages/concepts/tools/tools-register.vue'
import ToolsChangePage from './pages/concepts/tools/tools-change.vue'
import ViewportChangePage from './pages/concepts/viewport/viewport-change.vue'
import ViewportCenterPage from './pages/concepts/viewport/viewport-center.vue'
import ViewportCoordinatesPage from './pages/concepts/viewport/viewport-coordinates.vue'
import WorkspacesSwitchPage from './pages/concepts/workspaces/workspaces-switch.vue'
import WorkspacesCrudPage from './pages/concepts/workspaces/workspaces-crud.vue'

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
      path: '/concepts',
      children: [
        { path: 'collaboration-local', component: CollaborationLocalPage },
        { path: 'collaboration-realtime', component: CollaborationRealtimePage },
        { path: 'components-editor', component: ComponentsEditorPage },
        { path: 'components-editor-ui', component: ComponentsEditorUiPage },
        { path: 'components-engine', component: ComponentsEnginePage },
        {
          path: 'context-menus-canvas-quick-actions',
          component: CustomContextMenuCanvasQuickActionsPage,
        },
        {
          path: 'context-menus-clipboard-actions',
          component: CustomContextMenuClipboardActionsPage,
        },
        {
          path: 'context-menus-smart-conditional',
          component: CustomContextMenuSmartConditionalPage,
        },
        {
          path: 'context-menus-object-inspector',
          component: CustomContextMenuObjectInspectorPage,
        },
        { path: 'objects-add-remove', component: ObjectsAddRemovePage },
        { path: 'objects-query', component: ObjectsQueryPage },
        { path: 'objects-selection', component: ObjectsSelectionPage },
        { path: 'objects-grouping', component: ObjectsGroupingPage },
        { path: 'objects-ordering', component: ObjectsOrderingPage },
        { path: 'persistence-local', component: PersistenceLocalPage },
        { path: 'theming-apply', component: ThemingApplyPage },
        { path: 'theming-custom', component: ThemingCustomPage },
        { path: 'tools-disable', component: ToolsDisablePage },
        { path: 'tools-controls', component: ToolsControlsPage },
        { path: 'tools-register', component: ToolsRegisterPage },
        { path: 'tools-change', component: ToolsChangePage },
        { path: 'viewport-change', component: ViewportChangePage },
        { path: 'viewport-center', component: ViewportCenterPage },
        { path: 'viewport-coordinates', component: ViewportCoordinatesPage },
        { path: 'workspaces-switch', component: WorkspacesSwitchPage },
        { path: 'workspaces-crud', component: WorkspacesCrudPage },
      ],
    },
    {
      path: '/examples',
      children: [
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/e2e/editor' },
  ],
})
