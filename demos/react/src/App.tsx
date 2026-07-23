import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/e2e/EditorPage";
import { MultiEditorPage } from "./pages/e2e/MultiEditorPage";
import { WrappedEditorPage } from "./pages/e2e/WrappedEditorPage";
import { BasicUsagePage } from "./pages/basic-usage/BasicUsagePage";
import { CollaborationLocalPage } from "./pages/concepts/collaboration/CollaborationLocalPage";
import { CollaborationRealtimePage } from "./pages/concepts/collaboration/CollaborationRealtimePage";
import { ComponentsEditorPage } from "./pages/concepts/components/ComponentsEditorPage";
import { ComponentsEditorUiPage } from "./pages/concepts/components/ComponentsEditorUiPage";
import { ComponentsEnginePage } from "./pages/concepts/components/ComponentsEnginePage";
import { CustomContextMenuCanvasQuickActionsPage } from "./pages/concepts/context-menus/CustomContextMenuCanvasQuickActionsPage";
import { CustomContextMenuClipboardActionsPage } from "./pages/concepts/context-menus/CustomContextMenuClipboardActionsPage";
import { CustomContextMenuSmartConditionalPage } from "./pages/concepts/context-menus/CustomContextMenuSmartConditionalPage";
import { CustomContextMenuObjectInspectorPage } from "./pages/concepts/context-menus/CustomContextMenuObjectInspectorPage";
import { CustomElementsPage } from "./pages/concepts/custom-elements/CustomElementsPage";
import { CustomElementsHtmlPage } from "./pages/concepts/custom-elements/CustomElementsHtmlPage";
import { ObjectsAddRemovePage } from "./pages/concepts/objects/ObjectsAddRemovePage";
import { ObjectsQueryPage } from "./pages/concepts/objects/ObjectsQueryPage";
import { ObjectsSelectionPage } from "./pages/concepts/objects/ObjectsSelectionPage";
import { ObjectsGroupingPage } from "./pages/concepts/objects/ObjectsGroupingPage";
import { ObjectsOrderingPage } from "./pages/concepts/objects/ObjectsOrderingPage";
import { PersistenceLocalPage } from "./pages/concepts/persistence/PersistenceLocalPage";
import { ThemingApplyPage } from "./pages/concepts/theming/ThemingApplyPage";
import { ThemingCustomPage } from "./pages/concepts/theming/ThemingCustomPage";
import { ToolsDisablePage } from "./pages/concepts/tools/ToolsDisablePage";
import { ToolsControlsPage } from "./pages/concepts/tools/ToolsControlsPage";
import { ToolsRegisterPage } from "./pages/concepts/tools/ToolsRegisterPage";
import { ToolsChangePage } from "./pages/concepts/tools/ToolsChangePage";
import { ViewportChangePage } from "./pages/concepts/viewport/ViewportChangePage";
import { ViewportCenterPage } from "./pages/concepts/viewport/ViewportCenterPage";
import { ViewportCoordinatesPage } from "./pages/concepts/viewport/ViewportCoordinatesPage";
import { WorkspacesSwitchPage } from "./pages/concepts/workspaces/WorkspacesSwitchPage";
import { WorkspacesCrudPage } from "./pages/concepts/workspaces/WorkspacesCrudPage";
import { QuickstartPage } from "./pages/getting-started/QuickstartPage";
import { ObjectExplorerPage } from "./pages/examples/object-explorer/ObjectExplorerPage";
import { BlueprintDefectMapperPage } from "./pages/examples/blueprint-defect-mapper/BlueprintDefectMapperPage";
import { SlideshowPresentationPage } from "./pages/examples/slideshow-presentation/SlideshowPresentationPage";
import { InfiniteCanvasGalleryPage } from "./pages/examples/infinite-canvas-gallery/InfiniteCanvasGalleryPage";
import { ImageAnnotationStudioPage } from "./pages/examples/image-annotation-studio/ImageAnnotationStudioPage";
import { WebsiteHeroPage } from "./pages/website/WebsiteHeroPage";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/e2e/editor" replace />} />
        <Route path="/e2e/editor" element={<EditorPage />} />
        <Route path="/e2e/multi-editor" element={<MultiEditorPage />} />
        <Route path="/e2e/wrapped-editor" element={<WrappedEditorPage />} />
        <Route path="/basic-usage" element={<BasicUsagePage />} />
        <Route path="/concepts/collaboration-local" element={<CollaborationLocalPage />} />
        <Route path="/concepts/collaboration-realtime" element={<CollaborationRealtimePage />} />
        <Route path="/concepts/components-editor" element={<ComponentsEditorPage />} />
        <Route path="/concepts/components-editor-ui" element={<ComponentsEditorUiPage />} />
        <Route path="/concepts/components-engine" element={<ComponentsEnginePage />} />
        <Route path="/concepts/context-menus-canvas-quick-actions" element={<CustomContextMenuCanvasQuickActionsPage />} />
        <Route path="/concepts/context-menus-clipboard-actions" element={<CustomContextMenuClipboardActionsPage />} />
        <Route path="/concepts/context-menus-smart-conditional" element={<CustomContextMenuSmartConditionalPage />} />
        <Route path="/concepts/context-menus-object-inspector" element={<CustomContextMenuObjectInspectorPage />} />
        <Route path="/concepts/custom-elements" element={<CustomElementsPage />} />
        <Route path="/concepts/custom-elements-html" element={<CustomElementsHtmlPage />} />
        <Route path="/concepts/objects-add-remove" element={<ObjectsAddRemovePage />} />
        <Route path="/concepts/objects-query" element={<ObjectsQueryPage />} />
        <Route path="/concepts/objects-selection" element={<ObjectsSelectionPage />} />
        <Route path="/concepts/objects-grouping" element={<ObjectsGroupingPage />} />
        <Route path="/concepts/objects-ordering" element={<ObjectsOrderingPage />} />
        <Route path="/concepts/persistence-local" element={<PersistenceLocalPage />} />
        <Route path="/concepts/theming-apply" element={<ThemingApplyPage />} />
        <Route path="/concepts/theming-custom" element={<ThemingCustomPage />} />
        <Route path="/concepts/tools-disable" element={<ToolsDisablePage />} />
        <Route path="/concepts/tools-controls" element={<ToolsControlsPage />} />
        <Route path="/concepts/tools-register" element={<ToolsRegisterPage />} />
        <Route path="/concepts/tools-change" element={<ToolsChangePage />} />
        <Route path="/concepts/viewport-change" element={<ViewportChangePage />} />
        <Route path="/concepts/viewport-center" element={<ViewportCenterPage />} />
        <Route path="/concepts/viewport-coordinates" element={<ViewportCoordinatesPage />} />
        <Route path="/concepts/workspaces-switch" element={<WorkspacesSwitchPage />} />
        <Route path="/concepts/workspaces-crud" element={<WorkspacesCrudPage />} />
        <Route path="/getting-started" element={<QuickstartPage />} />
        <Route path="/examples/object-explorer" element={<ObjectExplorerPage />} />
        <Route path="/examples/blueprint-defect-mapper" element={<BlueprintDefectMapperPage />} />
        <Route path="/examples/slideshow-presentation" element={<SlideshowPresentationPage />} />
        <Route path="/examples/infinite-canvas-gallery" element={<InfiniteCanvasGalleryPage />} />
        <Route path="/examples/image-annotation-studio" element={<ImageAnnotationStudioPage />} />
        <Route path="/website/hero" element={<WebsiteHeroPage />} />
        <Route path="*" element={<Navigate to="/e2e/editor" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
