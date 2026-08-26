import { createRouter, createWebHashHistory } from 'vue-router'
import QuickStartPage from './pages/getting-started/QuickStartPage.vue'
import BasicUsagePage from './pages/getting-started/BasicUsagePage.vue'
import ComponentsEditorPage from './pages/fundamentals/components/ComponentsEditorPage.vue'
import ComponentsEditorUiPage from './pages/fundamentals/components/ComponentsEditorUiPage.vue'
import ComponentsEnginePage from './pages/fundamentals/components/ComponentsEnginePage.vue'
import UserManagementProvidersPage from './pages/fundamentals/components/UserManagementProvidersPage.vue'
import UserManagementFlowPage from './pages/fundamentals/components/UserManagementFlowPage.vue'
import ContextMenusCanvasQuickActionsPage from './pages/fundamentals/components/ContextMenusCanvasQuickActionsPage.vue'
import ContextMenusClipboardActionsPage from './pages/fundamentals/components/ContextMenusClipboardActionsPage.vue'
import ContextMenusSmartConditionalPage from './pages/fundamentals/components/ContextMenusSmartConditionalPage.vue'
import ContextMenusObjectInspectorPage from './pages/fundamentals/components/ContextMenusObjectInspectorPage.vue'
import ObjectsAddRemovePage from './pages/fundamentals/objects/ObjectsAddRemovePage.vue'
import ObjectsQueryPage from './pages/fundamentals/objects/ObjectsQueryPage.vue'
import ObjectsSelectionPage from './pages/fundamentals/objects/ObjectsSelectionPage.vue'
import ObjectsGroupingPage from './pages/fundamentals/objects/ObjectsGroupingPage.vue'
import ObjectsOrderingPage from './pages/fundamentals/objects/ObjectsOrderingPage.vue'
import ToolsDisablePage from './pages/fundamentals/tools/ToolsDisablePage.vue'
import ToolsToolbarPage from './pages/fundamentals/tools/ToolsToolbarPage.vue'
import ToolsRegisterPage from './pages/fundamentals/tools/ToolsRegisterPage.vue'
import ToolsChangePage from './pages/fundamentals/tools/ToolsChangePage.vue'
import ViewportChangePage from './pages/fundamentals/viewport/ViewportChangePage.vue'
import ViewportCenterPage from './pages/fundamentals/viewport/ViewportCenterPage.vue'
import ViewportCoordinatesPage from './pages/fundamentals/viewport/ViewportCoordinatesPage.vue'
import WorkspacesSwitchPage from './pages/fundamentals/workspaces/WorkspacesSwitchPage.vue'
import WorkspacesCrudPage from './pages/fundamentals/workspaces/WorkspacesCrudPage.vue'
import PersistenceLocalPage from './pages/fundamentals/persistence/PersistenceLocalPage.vue'
import CollaborationLocalPage from './pages/advanced/collaboration/CollaborationLocalPage.vue'
import CollaborationRealtimePage from './pages/advanced/collaboration/CollaborationRealtimePage.vue'
import DynamicObjectsHtmlPage from './pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.vue'
import DynamicObjectsComponentPage from './pages/advanced/dynamic-objects/DynamicObjectsComponentPage.vue'
import DynamicObjectsCustomElementPage from './pages/advanced/dynamic-objects/DynamicObjectsCustomElementPage.vue'
import DynamicObjectsCustomElementHtmlPage from './pages/advanced/dynamic-objects/DynamicObjectsCustomElementHtmlPage.vue'
import ThemingApplyPage from './pages/customization/theming/ThemingApplyPage.vue'
import ThemingCustomPage from './pages/customization/theming/ThemingCustomPage.vue'
import FontsRegisterPage from './pages/customization/fonts/FontsRegisterPage.vue'
import IconsRegisterPage from './pages/customization/icons/IconsRegisterPage.vue'
import LocalizationSwitchPage from './pages/customization/localization/LocalizationSwitchPage.vue'
import LocalizationCustomPage from './pages/customization/localization/LocalizationCustomPage.vue'
import ObjectExplorerPage from './pages/examples/ObjectExplorerPage.vue'
import BlueprintDefectMapperPage from './pages/examples/BlueprintDefectMapperPage.vue'
import SlideshowPresentationPage from './pages/examples/SlideshowPresentationPage.vue'
import InfiniteCanvasGalleryPage from './pages/examples/InfiniteCanvasGalleryPage.vue'
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
          path: 'components',
          children: [
            { path: 'editor', component: ComponentsEditorPage },
            { path: 'editor-ui', component: ComponentsEditorUiPage },
            { path: 'engine', component: ComponentsEnginePage },
            { path: 'user-management-providers', component: UserManagementProvidersPage },
            { path: 'user-management-flow', component: UserManagementFlowPage },
            { path: 'context-menus-canvas-quick-actions', component: ContextMenusCanvasQuickActionsPage },
            { path: 'context-menus-clipboard-actions', component: ContextMenusClipboardActionsPage },
            { path: 'context-menus-smart-conditional', component: ContextMenusSmartConditionalPage },
            { path: 'context-menus-object-inspector', component: ContextMenusObjectInspectorPage },
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
            { path: 'coordinates', component: ViewportCoordinatesPage },
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
            { path: 'custom-element', component: DynamicObjectsCustomElementPage },
            { path: 'custom-element-html', component: DynamicObjectsCustomElementHtmlPage },
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
        { path: 'infinite-canvas-gallery', component: InfiniteCanvasGalleryPage },
        { path: 'image-annotation-studio', component: ImageAnnotationStudioPage },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/getting-started/quick-start' },
  ],
})
