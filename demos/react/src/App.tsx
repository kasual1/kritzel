import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QuickStartPage } from "./pages/getting-started/QuickStartPage";
import { BasicUsagePage } from "./pages/getting-started/BasicUsagePage";
import { ComponentsEditorPage } from "./pages/fundamentals/components/ComponentsEditorPage";
import { ComponentsEditorUiPage } from "./pages/fundamentals/components/ComponentsEditorUiPage";
import { ComponentsEnginePage } from "./pages/fundamentals/components/ComponentsEnginePage";
import { UserManagementProvidersPage } from "./pages/fundamentals/components/UserManagementProvidersPage";
import { UserManagementFlowPage } from "./pages/fundamentals/components/UserManagementFlowPage";
import { ContextMenusCanvasQuickActionsPage } from "./pages/fundamentals/components/ContextMenusCanvasQuickActionsPage";
import { ContextMenusClipboardActionsPage } from "./pages/fundamentals/components/ContextMenusClipboardActionsPage";
import { ContextMenusSmartConditionalPage } from "./pages/fundamentals/components/ContextMenusSmartConditionalPage";
import { ContextMenusObjectInspectorPage } from "./pages/fundamentals/components/ContextMenusObjectInspectorPage";
import { ObjectsAddRemovePage } from "./pages/fundamentals/objects/ObjectsAddRemovePage";
import { ObjectsQueryPage } from "./pages/fundamentals/objects/ObjectsQueryPage";
import { ObjectsSelectionPage } from "./pages/fundamentals/objects/ObjectsSelectionPage";
import { ObjectsGroupingPage } from "./pages/fundamentals/objects/ObjectsGroupingPage";
import { ObjectsOrderingPage } from "./pages/fundamentals/objects/ObjectsOrderingPage";
import { ToolsDisablePage } from "./pages/fundamentals/tools/ToolsDisablePage";
import { ToolsToolbarPage } from "./pages/fundamentals/tools/ToolsToolbarPage";
import { ToolsRegisterPage } from "./pages/fundamentals/tools/ToolsRegisterPage";
import { ToolsChangePage } from "./pages/fundamentals/tools/ToolsChangePage";
import { ViewportChangePage } from "./pages/fundamentals/viewport/ViewportChangePage";
import { ViewportCenterPage } from "./pages/fundamentals/viewport/ViewportCenterPage";
import { ViewportCoordinatesPage } from "./pages/fundamentals/viewport/ViewportCoordinatesPage";
import { WorkspacesSwitchPage } from "./pages/fundamentals/workspaces/WorkspacesSwitchPage";
import { WorkspacesCrudPage } from "./pages/fundamentals/workspaces/WorkspacesCrudPage";
import { PersistenceLocalPage } from "./pages/fundamentals/persistence/PersistenceLocalPage";
import { CollaborationLocalPage } from "./pages/advanced/collaboration/CollaborationLocalPage";
import { CollaborationRealtimePage } from "./pages/advanced/collaboration/CollaborationRealtimePage";
import { DynamicObjectsHtmlPage } from "./pages/advanced/dynamic-objects/DynamicObjectsHtmlPage";
import { DynamicObjectsComponentPage } from "./pages/advanced/dynamic-objects/DynamicObjectsComponentPage";
import { DynamicObjectsCustomElementPage } from "./pages/advanced/dynamic-objects/DynamicObjectsCustomElementPage";
import { DynamicObjectsCustomElementHtmlPage } from "./pages/advanced/dynamic-objects/DynamicObjectsCustomElementHtmlPage";
import { ThemingApplyPage } from "./pages/customization/theming/ThemingApplyPage";
import { ThemingCustomPage } from "./pages/customization/theming/ThemingCustomPage";
import { FontsRegisterPage } from "./pages/customization/fonts/FontsRegisterPage";
import { IconsRegisterPage } from "./pages/customization/icons/IconsRegisterPage";
import { LocalizationSwitchPage } from "./pages/customization/localization/LocalizationSwitchPage";
import { LocalizationCustomPage } from "./pages/customization/localization/LocalizationCustomPage";
import { ObjectExplorerPage } from "./pages/examples/ObjectExplorerPage";
import { BlueprintDefectMapperPage } from "./pages/examples/BlueprintDefectMapperPage";
import { SlideshowPresentationPage } from "./pages/examples/SlideshowPresentationPage";
import { InfiniteCanvasGalleryPage } from "./pages/examples/InfiniteCanvasGalleryPage";
import { ImageAnnotationStudioPage } from "./pages/examples/ImageAnnotationStudioPage";
import { WebsiteHeroPage } from "./pages/website/WebsiteHeroPage";
import { WebsiteHeroPageMobile } from "./pages/website/WebsiteHeroPageMobile";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/getting-started/quick-start" replace />} />

        <Route path="/getting-started/quick-start" element={<QuickStartPage />} />
        <Route path="/getting-started/basic-usage" element={<BasicUsagePage />} />

        <Route path="/fundamentals/components/editor" element={<ComponentsEditorPage />} />
        <Route path="/fundamentals/components/editor-ui" element={<ComponentsEditorUiPage />} />
        <Route path="/fundamentals/components/engine" element={<ComponentsEnginePage />} />
        <Route path="/fundamentals/components/user-management-providers" element={<UserManagementProvidersPage />} />
        <Route path="/fundamentals/components/user-management-flow" element={<UserManagementFlowPage />} />
        <Route path="/fundamentals/components/context-menus-canvas-quick-actions" element={<ContextMenusCanvasQuickActionsPage />} />
        <Route path="/fundamentals/components/context-menus-clipboard-actions" element={<ContextMenusClipboardActionsPage />} />
        <Route path="/fundamentals/components/context-menus-smart-conditional" element={<ContextMenusSmartConditionalPage />} />
        <Route path="/fundamentals/components/context-menus-object-inspector" element={<ContextMenusObjectInspectorPage />} />
        <Route path="/fundamentals/objects/add-remove" element={<ObjectsAddRemovePage />} />
        <Route path="/fundamentals/objects/query" element={<ObjectsQueryPage />} />
        <Route path="/fundamentals/objects/selection" element={<ObjectsSelectionPage />} />
        <Route path="/fundamentals/objects/grouping" element={<ObjectsGroupingPage />} />
        <Route path="/fundamentals/objects/ordering" element={<ObjectsOrderingPage />} />
        <Route path="/fundamentals/tools/disable" element={<ToolsDisablePage />} />
        <Route path="/fundamentals/tools/toolbar" element={<ToolsToolbarPage />} />
        <Route path="/fundamentals/tools/register" element={<ToolsRegisterPage />} />
        <Route path="/fundamentals/tools/change" element={<ToolsChangePage />} />
        <Route path="/fundamentals/viewport/change" element={<ViewportChangePage />} />
        <Route path="/fundamentals/viewport/center" element={<ViewportCenterPage />} />
        <Route path="/fundamentals/viewport/coordinates" element={<ViewportCoordinatesPage />} />
        <Route path="/fundamentals/workspaces/switch" element={<WorkspacesSwitchPage />} />
        <Route path="/fundamentals/workspaces/crud" element={<WorkspacesCrudPage />} />
        <Route path="/fundamentals/persistence/local" element={<PersistenceLocalPage />} />

        <Route path="/advanced/collaboration/local" element={<CollaborationLocalPage />} />
        <Route path="/advanced/collaboration/realtime" element={<CollaborationRealtimePage />} />
        <Route path="/advanced/dynamic-objects/html" element={<DynamicObjectsHtmlPage />} />
        <Route path="/advanced/dynamic-objects/component" element={<DynamicObjectsComponentPage />} />
        <Route path="/advanced/dynamic-objects/custom-element" element={<DynamicObjectsCustomElementPage />} />
        <Route path="/advanced/dynamic-objects/custom-element-html" element={<DynamicObjectsCustomElementHtmlPage />} />

        <Route path="/customization/theming/apply" element={<ThemingApplyPage />} />
        <Route path="/customization/theming/custom" element={<ThemingCustomPage />} />
        <Route path="/customization/fonts/register" element={<FontsRegisterPage />} />
        <Route path="/customization/icons/register" element={<IconsRegisterPage />} />
        <Route path="/customization/localization/switch" element={<LocalizationSwitchPage />} />
        <Route path="/customization/localization/custom" element={<LocalizationCustomPage />} />

        <Route path="/examples/object-explorer" element={<ObjectExplorerPage />} />
        <Route path="/examples/blueprint-defect-mapper" element={<BlueprintDefectMapperPage />} />
        <Route path="/examples/slideshow-presentation" element={<SlideshowPresentationPage />} />
        <Route path="/examples/infinite-canvas-gallery" element={<InfiniteCanvasGalleryPage />} />
        <Route path="/examples/image-annotation-studio" element={<ImageAnnotationStudioPage />} />

        <Route path="/website/hero" element={<WebsiteHeroPage />} />
        <Route path="/website/hero-mobile" element={<WebsiteHeroPageMobile />} />
        <Route path="*" element={<Navigate to="/getting-started/quick-start" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
