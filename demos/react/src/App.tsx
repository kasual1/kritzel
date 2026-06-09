import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { EditorPage } from "./pages/e2e/EditorPage";
import { MultiEditorPage } from "./pages/e2e/MultiEditorPage";
import { WrappedEditorPage } from "./pages/e2e/WrappedEditorPage";
import { BasicUsagePage } from "./pages/basic-usage/BasicUsagePage";
import { CollaborationLocalPage } from "./pages/concepts/collaboration/collaboration-local";
import { CollaborationRealtimePage } from "./pages/concepts/collaboration/collaboration-realtime";
import { ComponentsEditorPage } from "./pages/concepts/components/components-editor";
import { ComponentsEditorUiPage } from "./pages/concepts/components/components-editor-ui";
import { ComponentsEnginePage } from "./pages/concepts/components/components-engine";
import { CustomContextMenuCanvasQuickActionsPage } from "./pages/concepts/context-menus/custom-context-menu-canvas-quick-actions";
import { CustomContextMenuClipboardActionsPage } from "./pages/concepts/context-menus/custom-context-menu-clipboard-actions";
import { CustomContextMenuSmartConditionalPage } from "./pages/concepts/context-menus/custom-context-menu-smart-conditional";
import { CustomContextMenuObjectInspectorPage } from "./pages/concepts/context-menus/custom-context-menu-object-inspector";
import { ObjectsAddRemovePage } from "./pages/concepts/objects/objects-add-remove";
import { ObjectsQueryPage } from "./pages/concepts/objects/objects-query";
import { ObjectsSelectionPage } from "./pages/concepts/objects/objects-selection";
import { ObjectsGroupingPage } from "./pages/concepts/objects/objects-grouping";
import { ObjectsOrderingPage } from "./pages/concepts/objects/objects-ordering";
import { PersistenceLocalPage } from "./pages/concepts/persistence/persistence-local";
import { ThemingApplyPage } from "./pages/concepts/theming/theming-apply";
import { ThemingCustomPage } from "./pages/concepts/theming/theming-custom";
import { ToolsDisablePage } from "./pages/concepts/tools/tools-disable";
import { ToolsControlsPage } from "./pages/concepts/tools/tools-controls";
import { ToolsRegisterPage } from "./pages/concepts/tools/tools-register";
import { ToolsChangePage } from "./pages/concepts/tools/tools-change";
import { ViewportChangePage } from "./pages/concepts/viewport/viewport-change";
import { ViewportCenterPage } from "./pages/concepts/viewport/viewport-center";
import { ViewportCoordinatesPage } from "./pages/concepts/viewport/viewport-coordinates";
import { WorkspacesSwitchPage } from "./pages/concepts/workspaces/workspaces-switch";
import { WorkspacesCrudPage } from "./pages/concepts/workspaces/workspaces-crud";

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
        <Route path="*" element={<Navigate to="/e2e/editor" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
