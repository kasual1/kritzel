import { createRouter, createWebHashHistory } from 'vue-router'
import BasicUsagePage from './pages/getting-started/BasicUsagePage.vue'
import UserManagementProvidersPage from './pages/advanced/user-management/UserManagementProvidersPage.vue'
import QuickStartPage from './pages/getting-started/QuickStartPage.vue'
import UserManagementFlowPage from './pages/advanced/user-management/UserManagementFlowPage.vue'
import ComponentsEditorUiPage from './pages/fundamentals/controls/ComponentsEditorUiPage.vue'
import ContextMenusCanvasQuickActionsPage from './pages/fundamentals/controls/ContextMenusCanvasQuickActionsPage.vue'
import ContextMenusClipboardActionsPage from './pages/fundamentals/controls/ContextMenusClipboardActionsPage.vue'
import ContextMenusSmartConditionalPage from './pages/fundamentals/controls/ContextMenusSmartConditionalPage.vue'
import ContextMenusObjectInspectorPage from './pages/fundamentals/controls/ContextMenusObjectInspectorPage.vue'
import NotificationsTriggerPage from './pages/fundamentals/controls/NotificationsTriggerPage.vue'
import ObjectsAddRemovePage from './pages/fundamentals/objects/ObjectsAddRemovePage.vue'
import ObjectsQueryPage from './pages/fundamentals/objects/ObjectsQueryPage.vue'
import ObjectsSelectionPage from './pages/fundamentals/objects/ObjectsSelectionPage.vue'
import ObjectsGroupingPage from './pages/fundamentals/objects/ObjectsGroupingPage.vue'
import ObjectsOrderingPage from './pages/fundamentals/objects/ObjectsOrderingPage.vue'
import ToolsDisablePage from './pages/fundamentals/tools/ToolsDisablePage.vue'
import ToolsToolbarItemDisablePage from './pages/fundamentals/tools/ToolsToolbarItemDisablePage.vue'
import ToolsToolbarPage from './pages/fundamentals/tools/ToolsToolbarPage.vue'
import ToolsRegisterPage from './pages/fundamentals/tools/ToolsRegisterPage.vue'
import ToolsChangePage from './pages/fundamentals/tools/ToolsChangePage.vue'
import ViewportChangePage from './pages/fundamentals/viewport/ViewportChangePage.vue'
import ViewportCenterPage from './pages/fundamentals/viewport/ViewportCenterPage.vue'
import WorkspacesSwitchPage from './pages/fundamentals/workspaces/WorkspacesSwitchPage.vue'
import WorkspacesCrudPage from './pages/fundamentals/workspaces/WorkspacesCrudPage.vue'
import PersistenceLocalPage from './pages/fundamentals/persistence/PersistenceLocalPage.vue'
import CollaborationLocalPage from './pages/advanced/collaboration/CollaborationLocalPage.vue'
import CollaborationRealtimePage from './pages/advanced/collaboration/CollaborationRealtimePage.vue'
import DynamicObjectsHtmlPage from './pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.vue'
import DynamicObjectsComponentPage from './pages/advanced/dynamic-objects/DynamicObjectsComponentPage.vue'
import DynamicObjectsElementPage from './pages/advanced/dynamic-objects/DynamicObjectsElementPage.vue'
import DynamicObjectsElementHtmlPage from './pages/advanced/dynamic-objects/DynamicObjectsElementHtmlPage.vue'
import ImportExportViewportExportPage from './pages/advanced/import-export/ImportExportViewportExportPage.vue'
import ImportExportWorkspaceExportPage from './pages/advanced/import-export/ImportExportWorkspaceExportPage.vue'
import ImportExportWorkspaceImportPage from './pages/advanced/import-export/ImportExportWorkspaceImportPage.vue'
import ThemingApplyPage from './pages/customization/theming/ThemingApplyPage.vue'
import ThemingCustomPage from './pages/customization/theming/ThemingCustomPage.vue'
import FontsRegisterPage from './pages/customization/fonts/FontsRegisterPage.vue'
import IconsRegisterPage from './pages/customization/icons/IconsRegisterPage.vue'
import LocalizationSwitchPage from './pages/customization/localization/LocalizationSwitchPage.vue'
import LocalizationCustomPage from './pages/customization/localization/LocalizationCustomPage.vue'
import ObjectExplorerPage from './pages/examples/ObjectExplorerPage.vue'
import BlueprintDefectMapperPage from './pages/examples/BlueprintDefectMapperPage.vue'
import SlideshowPresentationPage from './pages/examples/SlideshowPresentationPage.vue'
import ImageAnnotationStudioPage from './pages/examples/ImageAnnotationStudioPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/getting-started/quick-start' },
    {
      path: '/getting-started',
      children: [
        { path: 'quick-start', component: QuickStartPage },
        { path: 'basic-usage', component: BasicUsagePage },
      ],
    },
    {
      path: '/fundamentals',
      children: [
        {
          path: 'controls',
          children: [
            { path: 'editor-ui', component: ComponentsEditorUiPage },
            { path: 'context-menus-canvas-quick-actions', component: ContextMenusCanvasQuickActionsPage },
            { path: 'context-menus-clipboard-actions', component: ContextMenusClipboardActionsPage },
            { path: 'context-menus-smart-conditional', component: ContextMenusSmartConditionalPage },
            { path: 'context-menus-object-inspector', component: ContextMenusObjectInspectorPage },
            { path: 'notifications-trigger', component: NotificationsTriggerPage },
          ],
        },
        {
          path: 'objects',
          children: [
            { path: 'add-remove', component: ObjectsAddRemovePage },
            { path: 'query', component: ObjectsQueryPage },
            { path: 'selection', component: ObjectsSelectionPage },
            { path: 'grouping', component: ObjectsGroupingPage },
            { path: 'ordering', component: ObjectsOrderingPage },
          ],
        },
        {
          path: 'tools',
          children: [
            { path: 'disable', component: ToolsDisablePage },
            { path: 'toolbar-item-disable', component: ToolsToolbarItemDisablePage },
            { path: 'toolbar', component: ToolsToolbarPage },
            { path: 'register', component: ToolsRegisterPage },
            { path: 'change', component: ToolsChangePage },
          ],
        },
        {
          path: 'viewport',
          children: [
            { path: 'change', component: ViewportChangePage },
            { path: 'center', component: ViewportCenterPage },
          ],
        },
        {
          path: 'workspaces',
          children: [
            { path: 'switch', component: WorkspacesSwitchPage },
            { path: 'crud', component: WorkspacesCrudPage },
          ],
        },
        {
          path: 'persistence',
          children: [{ path: 'local', component: PersistenceLocalPage }],
        },
      ],
    },
    {
      path: '/advanced',
      children: [
        {
          path: 'user-management',
          children: [
            { path: 'providers', component: UserManagementProvidersPage },
            { path: 'flow', component: UserManagementFlowPage },
          ],
        },
        {
          path: 'collaboration',
          children: [
            { path: 'local', component: CollaborationLocalPage },
            { path: 'realtime', component: CollaborationRealtimePage },
          ],
        },
        {
          path: 'dynamic-objects',
          children: [
            { path: 'html', component: DynamicObjectsHtmlPage },
            { path: 'component', component: DynamicObjectsComponentPage },
            { path: 'element', component: DynamicObjectsElementPage },
            { path: 'element-html', component: DynamicObjectsElementHtmlPage },
          ],
        },
        {
          path: 'import-export',
          children: [
            { path: 'viewport-export', component: ImportExportViewportExportPage },
            { path: 'workspace-export', component: ImportExportWorkspaceExportPage },
            { path: 'workspace-import', component: ImportExportWorkspaceImportPage },
          ],
        },
      ],
    },
    {
      path: '/customization',
      children: [
        {
          path: 'theming',
          children: [
            { path: 'apply', component: ThemingApplyPage },
            { path: 'custom', component: ThemingCustomPage },
          ],
        },
        {
          path: 'fonts',
          children: [{ path: 'register', component: FontsRegisterPage }],
        },
        {
          path: 'icons',
          children: [{ path: 'register', component: IconsRegisterPage }],
        },
        {
          path: 'localization',
          children: [
            { path: 'switch', component: LocalizationSwitchPage },
            { path: 'custom', component: LocalizationCustomPage },
          ],
        },
      ],
    },
    {
      path: '/examples',
      children: [
        { path: 'object-explorer', component: ObjectExplorerPage },
        { path: 'blueprint-defect-mapper', component: BlueprintDefectMapperPage },
        { path: 'slideshow-presentation', component: SlideshowPresentationPage },
        { path: 'image-annotation-studio', component: ImageAnnotationStudioPage },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/getting-started/quick-start' },
  ],
})
