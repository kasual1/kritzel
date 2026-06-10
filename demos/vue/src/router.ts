import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'
import BasicUsagePage from './pages/basic-usage/BasicUsagePage.vue'
import CollaborationLocalPage from './pages/concepts/collaboration/CollaborationLocalPage.vue'
import CollaborationRealtimePage from './pages/concepts/collaboration/CollaborationRealtimePage.vue'
import ComponentsEditorPage from './pages/concepts/components/ComponentsEditorPage.vue'
import ComponentsEditorUiPage from './pages/concepts/components/ComponentsEditorUiPage.vue'
import ComponentsEnginePage from './pages/concepts/components/ComponentsEnginePage.vue'
import CustomContextMenuCanvasQuickActionsPage from './pages/concepts/context-menus/CustomContextMenuCanvasQuickActionsPage.vue'
import CustomContextMenuClipboardActionsPage from './pages/concepts/context-menus/CustomContextMenuClipboardActionsPage.vue'
import CustomContextMenuSmartConditionalPage from './pages/concepts/context-menus/CustomContextMenuSmartConditionalPage.vue'
import CustomContextMenuObjectInspectorPage from './pages/concepts/context-menus/CustomContextMenuObjectInspectorPage.vue'
import ObjectsAddRemovePage from './pages/concepts/objects/ObjectsAddRemovePage.vue'
import ObjectsQueryPage from './pages/concepts/objects/ObjectsQueryPage.vue'
import ObjectsSelectionPage from './pages/concepts/objects/ObjectsSelectionPage.vue'
import ObjectsGroupingPage from './pages/concepts/objects/ObjectsGroupingPage.vue'
import ObjectsOrderingPage from './pages/concepts/objects/ObjectsOrderingPage.vue'
import PersistenceLocalPage from './pages/concepts/persistence/PersistenceLocalPage.vue'
import ThemingApplyPage from './pages/concepts/theming/ThemingApplyPage.vue'
import ThemingCustomPage from './pages/concepts/theming/ThemingCustomPage.vue'
import ToolsDisablePage from './pages/concepts/tools/ToolsDisablePage.vue'
import ToolsControlsPage from './pages/concepts/tools/ToolsControlsPage.vue'
import ToolsRegisterPage from './pages/concepts/tools/ToolsRegisterPage.vue'
import ToolsChangePage from './pages/concepts/tools/ToolsChangePage.vue'
import ViewportChangePage from './pages/concepts/viewport/ViewportChangePage.vue'
import ViewportCenterPage from './pages/concepts/viewport/ViewportCenterPage.vue'
import ViewportCoordinatesPage from './pages/concepts/viewport/ViewportCoordinatesPage.vue'
import WorkspacesSwitchPage from './pages/concepts/workspaces/WorkspacesSwitchPage.vue'
import WorkspacesCrudPage from './pages/concepts/workspaces/WorkspacesCrudPage.vue'

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
