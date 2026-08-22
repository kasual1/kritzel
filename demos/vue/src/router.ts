import { createRouter, createWebHashHistory } from 'vue-router'
import EditorPage from './pages/e2e/EditorPage.vue'
import EditorHocuspocusPage from './pages/e2e/EditorHocuspocusPage.vue'
import MultiEditorPage from './pages/e2e/MultiEditorPage.vue'
import WrappedEditorPage from './pages/e2e/WrappedEditorPage.vue'
import BasicUsagePage from './pages/basic-usage/BasicUsagePage.vue'
import CollaborationLocalPage from './pages/advanced/collaboration/CollaborationLocalPage.vue'
import CollaborationRealtimePage from './pages/advanced/collaboration/CollaborationRealtimePage.vue'
import ComponentsEditorPage from './pages/fundamentals/components/ComponentsEditorPage.vue'
import ComponentsEditorUiPage from './pages/fundamentals/components/ComponentsEditorUiPage.vue'
import ComponentsEnginePage from './pages/fundamentals/components/ComponentsEnginePage.vue'
import CustomContextMenuCanvasQuickActionsPage from './pages/advanced/context-menus/CustomContextMenuCanvasQuickActionsPage.vue'
import CustomContextMenuClipboardActionsPage from './pages/advanced/context-menus/CustomContextMenuClipboardActionsPage.vue'
import CustomContextMenuSmartConditionalPage from './pages/advanced/context-menus/CustomContextMenuSmartConditionalPage.vue'
import CustomContextMenuObjectInspectorPage from './pages/advanced/context-menus/CustomContextMenuObjectInspectorPage.vue'
import CustomElementsPage from './pages/fundamentals/custom-elements/CustomElementsPage.vue'
import CustomElementsHtmlPage from './pages/fundamentals/custom-elements/CustomElementsHtmlPage.vue'
import ObjectsAddRemovePage from './pages/fundamentals/objects/ObjectsAddRemovePage.vue'
import ObjectsQueryPage from './pages/fundamentals/objects/ObjectsQueryPage.vue'
import ObjectsSelectionPage from './pages/fundamentals/objects/ObjectsSelectionPage.vue'
import ObjectsGroupingPage from './pages/fundamentals/objects/ObjectsGroupingPage.vue'
import ObjectsOrderingPage from './pages/fundamentals/objects/ObjectsOrderingPage.vue'
import PersistenceLocalPage from './pages/fundamentals/persistence/PersistenceLocalPage.vue'
import ThemingApplyPage from './pages/advanced/customization/theming/ThemingApplyPage.vue'
import ThemingCustomPage from './pages/advanced/customization/theming/ThemingCustomPage.vue'
import ToolsDisablePage from './pages/fundamentals/tools/ToolsDisablePage.vue'
import ToolsControlsPage from './pages/fundamentals/tools/ToolsControlsPage.vue'
import ToolsRegisterPage from './pages/fundamentals/tools/ToolsRegisterPage.vue'
import ToolsChangePage from './pages/fundamentals/tools/ToolsChangePage.vue'
import ViewportChangePage from './pages/fundamentals/viewport/ViewportChangePage.vue'
import ViewportCenterPage from './pages/fundamentals/viewport/ViewportCenterPage.vue'
import ViewportCoordinatesPage from './pages/fundamentals/viewport/ViewportCoordinatesPage.vue'
import WorkspacesSwitchPage from './pages/fundamentals/workspaces/WorkspacesSwitchPage.vue'
import WorkspacesCrudPage from './pages/fundamentals/workspaces/WorkspacesCrudPage.vue'
import ObjectExplorerPage from './pages/examples/object-explorer/ObjectExplorerPage.vue'
import BlueprintDefectMapperPage from './pages/examples/blueprint-defect-mapper/BlueprintDefectMapperPage.vue'
import SlideshowPresentationPage from './pages/examples/slideshow-presentation/SlideshowPresentationPage.vue'
import InfiniteCanvasGalleryPage from './pages/examples/infinite-canvas-gallery/InfiniteCanvasGalleryPage.vue'
import ImageAnnotationStudioPage from './pages/examples/image-annotation-studio/ImageAnnotationStudioPage.vue'
import QuickstartPage from './pages/getting-started/QuickstartPage.vue'
import LocalizationSwitchPage from './pages/advanced/localization/LocalizationSwitchPage.vue'
import LocalizationCustomPage from './pages/advanced/localization/LocalizationCustomPage.vue'
import FontsRegisterPage from './pages/advanced/customization/fonts/FontsRegisterPage.vue'
import IconsRegisterPage from './pages/advanced/customization/icons/IconsRegisterPage.vue'
import UserManagementProvidersPage from './pages/advanced/user-management/UserManagementProvidersPage.vue'
import UserManagementFlowPage from './pages/advanced/user-management/UserManagementFlowPage.vue'
import DynamicObjectsHtmlPage from './pages/advanced/dynamic-objects/DynamicObjectsHtmlPage.vue'
import DynamicObjectsComponentPage from './pages/advanced/dynamic-objects/DynamicObjectsComponentPage.vue'

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
    {
      path: '/basic-usage',
      component: BasicUsagePage,
    },
    {
      path: '/advanced',
      children: [
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
        { path: 'collaboration-local', component: CollaborationLocalPage },
        { path: 'collaboration-realtime', component: CollaborationRealtimePage },
        { path: 'localization-switch', component: LocalizationSwitchPage },
        { path: 'localization-custom', component: LocalizationCustomPage },
        { path: 'user-management-providers', component: UserManagementProvidersPage },
        { path: 'user-management-flow', component: UserManagementFlowPage },
        { path: 'dynamic-objects-html', component: DynamicObjectsHtmlPage },
        { path: 'dynamic-objects-component', component: DynamicObjectsComponentPage },
        {
          path: 'customization',
          children: [
            { path: 'theming-apply', component: ThemingApplyPage },
            { path: 'theming-custom', component: ThemingCustomPage },
            { path: 'fonts-register', component: FontsRegisterPage },
            { path: 'icons', component: IconsRegisterPage },
          ],
        },
      ],
    },
    {
      path: '/fundamentals',
      children: [
        { path: 'components-editor', component: ComponentsEditorPage },
        { path: 'components-editor-ui', component: ComponentsEditorUiPage },
        { path: 'components-engine', component: ComponentsEnginePage },
        {
          path: 'custom-elements',
          component: CustomElementsPage,
        },
        {
          path: 'custom-elements-html',
          component: CustomElementsHtmlPage,
        },
        { path: 'objects-add-remove', component: ObjectsAddRemovePage },
        { path: 'objects-query', component: ObjectsQueryPage },
        { path: 'objects-selection', component: ObjectsSelectionPage },
        { path: 'objects-grouping', component: ObjectsGroupingPage },
        { path: 'objects-ordering', component: ObjectsOrderingPage },
        { path: 'persistence-local', component: PersistenceLocalPage },
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
      path: '/getting-started',
      component: QuickstartPage,
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
    { path: '/:pathMatch(.*)*', redirect: '/e2e/editor' },
  ],
})
