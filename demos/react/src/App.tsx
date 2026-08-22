import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/e2e/EditorPage";
import { EditorHocuspocusPage } from "./pages/e2e/EditorHocuspocusPage";
import { MultiEditorPage } from "./pages/e2e/MultiEditorPage";
import { WrappedEditorPage } from "./pages/e2e/WrappedEditorPage";
import { BasicUsagePage } from "./pages/basic-usage/BasicUsagePage";
import { CollaborationLocalPage } from "./pages/advanced/collaboration/CollaborationLocalPage";
import { CollaborationRealtimePage } from "./pages/advanced/collaboration/CollaborationRealtimePage";
import { ComponentsEditorPage } from "./pages/fundamentals/components/ComponentsEditorPage";
import { ComponentsEditorUiPage } from "./pages/fundamentals/components/ComponentsEditorUiPage";
import { ComponentsEnginePage } from "./pages/fundamentals/components/ComponentsEnginePage";
import { CustomContextMenuCanvasQuickActionsPage } from "./pages/advanced/context-menus/CustomContextMenuCanvasQuickActionsPage";
import { CustomContextMenuClipboardActionsPage } from "./pages/advanced/context-menus/CustomContextMenuClipboardActionsPage";
import { CustomContextMenuSmartConditionalPage } from "./pages/advanced/context-menus/CustomContextMenuSmartConditionalPage";
import { CustomContextMenuObjectInspectorPage } from "./pages/advanced/context-menus/CustomContextMenuObjectInspectorPage";
import { CustomElementsPage } from "./pages/fundamentals/custom-elements/CustomElementsPage";
import { CustomElementsHtmlPage } from "./pages/fundamentals/custom-elements/CustomElementsHtmlPage";
import { ObjectsAddRemovePage } from "./pages/fundamentals/objects/ObjectsAddRemovePage";
import { ObjectsQueryPage } from "./pages/fundamentals/objects/ObjectsQueryPage";
import { ObjectsSelectionPage } from "./pages/fundamentals/objects/ObjectsSelectionPage";
import { ObjectsGroupingPage } from "./pages/fundamentals/objects/ObjectsGroupingPage";
import { ObjectsOrderingPage } from "./pages/fundamentals/objects/ObjectsOrderingPage";
import { PersistenceLocalPage } from "./pages/fundamentals/persistence/PersistenceLocalPage";
import { ThemingApplyPage } from "./pages/advanced/customization/theming/ThemingApplyPage";
import { ThemingCustomPage } from "./pages/advanced/customization/theming/ThemingCustomPage";
import { ToolsDisablePage } from "./pages/fundamentals/tools/ToolsDisablePage";
import { ToolsControlsPage } from "./pages/fundamentals/tools/ToolsControlsPage";
import { ToolsRegisterPage } from "./pages/fundamentals/tools/ToolsRegisterPage";
import { ToolsChangePage } from "./pages/fundamentals/tools/ToolsChangePage";
import { ViewportChangePage } from "./pages/fundamentals/viewport/ViewportChangePage";
import { ViewportCenterPage } from "./pages/fundamentals/viewport/ViewportCenterPage";
import { ViewportCoordinatesPage } from "./pages/fundamentals/viewport/ViewportCoordinatesPage";
import { WorkspacesSwitchPage } from "./pages/fundamentals/workspaces/WorkspacesSwitchPage";
import { WorkspacesCrudPage } from "./pages/fundamentals/workspaces/WorkspacesCrudPage";
import { QuickstartPage } from "./pages/getting-started/QuickstartPage";
import { ObjectExplorerPage } from "./pages/examples/object-explorer/ObjectExplorerPage";
import { BlueprintDefectMapperPage } from "./pages/examples/blueprint-defect-mapper/BlueprintDefectMapperPage";
import { SlideshowPresentationPage } from "./pages/examples/slideshow-presentation/SlideshowPresentationPage";
import { InfiniteCanvasGalleryPage } from "./pages/examples/infinite-canvas-gallery/InfiniteCanvasGalleryPage";
import { ImageAnnotationStudioPage } from "./pages/examples/image-annotation-studio/ImageAnnotationStudioPage";
import { WebsiteHeroPage } from "./pages/website/WebsiteHeroPage";
import { WebsiteHeroPageMobile } from "./pages/website/WebsiteHeroPageMobile";
import { LocalizationSwitchPage } from "./pages/advanced/localization/LocalizationSwitchPage";
import { LocalizationCustomPage } from "./pages/advanced/localization/LocalizationCustomPage";
import { FontsRegisterPage } from "./pages/advanced/customization/fonts/FontsRegisterPage";
import { IconsRegisterPage } from "./pages/advanced/customization/icons/IconsRegisterPage";
import { UserManagementProvidersPage } from "./pages/advanced/user-management/UserManagementProvidersPage";
import { UserManagementFlowPage } from "./pages/advanced/user-management/UserManagementFlowPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/e2e/editor" replace />} />
        <Route path="/e2e/editor" element={<EditorPage />} />
        <Route path="/e2e/editor-hocuspocus" element={<EditorHocuspocusPage />} />
        <Route path="/e2e/multi-editor" element={<MultiEditorPage />} />
        <Route path="/e2e/wrapped-editor" element={<WrappedEditorPage />} />
        <Route path="/basic-usage" element={<BasicUsagePage />} />
        <Route path="/advanced/localization-switch" element={<LocalizationSwitchPage />} />
        <Route path="/advanced/localization-custom" element={<LocalizationCustomPage />} />
        <Route path="/advanced/customization/fonts-register" element={<FontsRegisterPage />} />
        <Route path="/advanced/customization/icons" element={<IconsRegisterPage />} />
        <Route path="/advanced/user-management-providers" element={<UserManagementProvidersPage />} />
        <Route path="/advanced/user-management-flow" element={<UserManagementFlowPage />} />
        <Route path="/advanced/collaboration-local" element={<CollaborationLocalPage />} />
        <Route path="/advanced/collaboration-realtime" element={<CollaborationRealtimePage />} />
        <Route path="/fundamentals/components-editor" element={<ComponentsEditorPage />} />
        <Route path="/fundamentals/components-editor-ui" element={<ComponentsEditorUiPage />} />
        <Route path="/fundamentals/components-engine" element={<ComponentsEnginePage />} />
        <Route path="/advanced/context-menus-canvas-quick-actions" element={<CustomContextMenuCanvasQuickActionsPage />} />
        <Route path="/advanced/context-menus-clipboard-actions" element={<CustomContextMenuClipboardActionsPage />} />
        <Route path="/advanced/context-menus-smart-conditional" element={<CustomContextMenuSmartConditionalPage />} />
        <Route path="/advanced/context-menus-object-inspector" element={<CustomContextMenuObjectInspectorPage />} />
        <Route path="/fundamentals/custom-elements" element={<CustomElementsPage />} />
        <Route path="/fundamentals/custom-elements-html" element={<CustomElementsHtmlPage />} />
        <Route path="/fundamentals/objects-add-remove" element={<ObjectsAddRemovePage />} />
        <Route path="/fundamentals/objects-query" element={<ObjectsQueryPage />} />
        <Route path="/fundamentals/objects-selection" element={<ObjectsSelectionPage />} />
        <Route path="/fundamentals/objects-grouping" element={<ObjectsGroupingPage />} />
        <Route path="/fundamentals/objects-ordering" element={<ObjectsOrderingPage />} />
        <Route path="/fundamentals/persistence-local" element={<PersistenceLocalPage />} />
        <Route path="/advanced/customization/theming-apply" element={<ThemingApplyPage />} />
        <Route path="/advanced/customization/theming-custom" element={<ThemingCustomPage />} />
        <Route path="/fundamentals/tools-disable" element={<ToolsDisablePage />} />
        <Route path="/fundamentals/tools-controls" element={<ToolsControlsPage />} />
        <Route path="/fundamentals/tools-register" element={<ToolsRegisterPage />} />
        <Route path="/fundamentals/tools-change" element={<ToolsChangePage />} />
        <Route path="/fundamentals/viewport-change" element={<ViewportChangePage />} />
        <Route path="/fundamentals/viewport-center" element={<ViewportCenterPage />} />
        <Route path="/fundamentals/viewport-coordinates" element={<ViewportCoordinatesPage />} />
        <Route path="/fundamentals/workspaces-switch" element={<WorkspacesSwitchPage />} />
        <Route path="/fundamentals/workspaces-crud" element={<WorkspacesCrudPage />} />
        <Route path="/getting-started" element={<QuickstartPage />} />
        <Route path="/examples/object-explorer" element={<ObjectExplorerPage />} />
        <Route path="/examples/blueprint-defect-mapper" element={<BlueprintDefectMapperPage />} />
        <Route path="/examples/slideshow-presentation" element={<SlideshowPresentationPage />} />
        <Route path="/examples/infinite-canvas-gallery" element={<InfiniteCanvasGalleryPage />} />
        <Route path="/examples/image-annotation-studio" element={<ImageAnnotationStudioPage />} />
        <Route path="/website/hero" element={<WebsiteHeroPage />} />
        <Route path="/website/hero-mobile" element={<WebsiteHeroPageMobile />} />
        <Route path="*" element={<Navigate to="/e2e/editor" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
