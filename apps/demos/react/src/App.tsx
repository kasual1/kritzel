import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QuickStartPage } from "./pages/getting-started/QuickstartPage";
import { BasicUsagePage } from "./pages/getting-started/BasicUsagePage";
import { UserManagementProvidersPage } from "./pages/advanced/user-management/UserManagementProvidersPage";
import { UserManagementFlowPage } from "./pages/advanced/user-management/UserManagementFlowPage";
import { ComponentsEditorUiPage } from "./pages/fundamentals/controls/ComponentsEditorUiPage";
import { ContextMenusCanvasQuickActionsPage } from "./pages/fundamentals/controls/ContextMenusCanvasQuickActionsPage";
import { ContextMenusClipboardActionsPage } from "./pages/fundamentals/controls/ContextMenusClipboardActionsPage";
import { ContextMenusSmartConditionalPage } from "./pages/fundamentals/controls/ContextMenusSmartConditionalPage";
import { ContextMenusObjectInspectorPage } from "./pages/fundamentals/controls/ContextMenusObjectInspectorPage";
import { NotificationsTriggerPage } from "./pages/fundamentals/controls/NotificationsTriggerPage";
import { ObjectsAddRemovePage } from "./pages/fundamentals/objects/ObjectsAddRemovePage";
import { ObjectsQueryPage } from "./pages/fundamentals/objects/ObjectsQueryPage";
import { ObjectsSelectionPage } from "./pages/fundamentals/objects/ObjectsSelectionPage";
import { ObjectsGroupingPage } from "./pages/fundamentals/objects/ObjectsGroupingPage";
import { ObjectsOrderingPage } from "./pages/fundamentals/objects/ObjectsOrderingPage";
import { ToolsDisablePage } from "./pages/fundamentals/tools/ToolsDisablePage";
import { ToolsToolbarItemDisablePage } from "./pages/fundamentals/tools/ToolsToolbarItemDisablePage";
import { ToolsToolbarPage } from "./pages/fundamentals/tools/ToolsToolbarPage";
import { ToolsRegisterPage } from "./pages/fundamentals/tools/ToolsRegisterPage";
import { ToolsChangePage } from "./pages/fundamentals/tools/ToolsChangePage";
import { ViewportChangePage } from "./pages/fundamentals/viewport/ViewportChangePage";
import { ViewportCenterPage } from "./pages/fundamentals/viewport/ViewportCenterPage";
import { WorkspacesSwitchPage } from "./pages/fundamentals/workspaces/WorkspacesSwitchPage";
import { WorkspacesCrudPage } from "./pages/fundamentals/workspaces/WorkspacesCrudPage";
import { PersistenceLocalPage } from "./pages/fundamentals/persistence/PersistenceLocalPage";
import { CollaborationLocalPage } from "./pages/advanced/collaboration/CollaborationLocalPage";
import { CollaborationRealtimePage } from "./pages/advanced/collaboration/CollaborationRealtimePage";
import { DynamicObjectsHtmlPage } from "./pages/advanced/dynamic-objects/DynamicObjectsHtmlPage";
import { DynamicObjectsComponentPage } from "./pages/advanced/dynamic-objects/DynamicObjectsComponentPage";
import { DynamicObjectsElementPage } from "./pages/advanced/dynamic-objects/DynamicObjectsElementPage";
import { DynamicObjectsElementHtmlPage } from "./pages/advanced/dynamic-objects/DynamicObjectsElementHtmlPage";
import { ImportExportViewportExportPage } from "./pages/advanced/import-export/ImportExportViewportExportPage";
import { ImportExportWorkspaceExportPage } from "./pages/advanced/import-export/ImportExportWorkspaceExportPage";
import { ImportExportWorkspaceImportPage } from "./pages/advanced/import-export/ImportExportWorkspaceImportPage";
import { ThemingApplyPage } from "./pages/customization/theming/ThemingApplyPage";
import { ThemingCustomPage } from "./pages/customization/theming/ThemingCustomPage";
import { FontsRegisterPage } from "./pages/customization/fonts/FontsRegisterPage";
import { IconsRegisterPage } from "./pages/customization/icons/IconsRegisterPage";
import { LocalizationSwitchPage } from "./pages/customization/localization/LocalizationSwitchPage";
import { LocalizationCustomPage } from "./pages/customization/localization/LocalizationCustomPage";
import { ObjectExplorerPage } from "./pages/examples/ObjectExplorerPage";
import { BlueprintDefectMapperPage } from "./pages/examples/BlueprintDefectMapperPage";
import { SlideshowPresentationPage } from "./pages/examples/SlideshowPresentationPage";
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

        <Route path="/fundamentals/controls/editor-ui" element={<ComponentsEditorUiPage />} />
        <Route path="/fundamentals/controls/context-menus-canvas-quick-actions" element={<ContextMenusCanvasQuickActionsPage />} />
        <Route path="/fundamentals/controls/context-menus-clipboard-actions" element={<ContextMenusClipboardActionsPage />} />
        <Route path="/fundamentals/controls/context-menus-smart-conditional" element={<ContextMenusSmartConditionalPage />} />
        <Route path="/fundamentals/controls/context-menus-object-inspector" element={<ContextMenusObjectInspectorPage />} />
        <Route path="/fundamentals/controls/notifications-trigger" element={<NotificationsTriggerPage />} />
        <Route path="/advanced/user-management/providers" element={<UserManagementProvidersPage />} />
        <Route path="/advanced/user-management/flow" element={<UserManagementFlowPage />} />
        <Route path="/fundamentals/objects/add-remove" element={<ObjectsAddRemovePage />} />
        <Route path="/fundamentals/objects/query" element={<ObjectsQueryPage />} />
        <Route path="/fundamentals/objects/selection" element={<ObjectsSelectionPage />} />
        <Route path="/fundamentals/objects/grouping" element={<ObjectsGroupingPage />} />
        <Route path="/fundamentals/objects/ordering" element={<ObjectsOrderingPage />} />
        <Route path="/fundamentals/tools/disable" element={<ToolsDisablePage />} />
        <Route path="/fundamentals/tools/toolbar-item-disable" element={<ToolsToolbarItemDisablePage />} />
        <Route path="/fundamentals/tools/toolbar" element={<ToolsToolbarPage />} />
        <Route path="/fundamentals/tools/register" element={<ToolsRegisterPage />} />
        <Route path="/fundamentals/tools/change" element={<ToolsChangePage />} />
        <Route path="/fundamentals/viewport/change" element={<ViewportChangePage />} />
        <Route path="/fundamentals/viewport/center" element={<ViewportCenterPage />} />
        <Route path="/fundamentals/workspaces/switch" element={<WorkspacesSwitchPage />} />
        <Route path="/fundamentals/workspaces/crud" element={<WorkspacesCrudPage />} />
        <Route path="/fundamentals/persistence/local" element={<PersistenceLocalPage />} />

        <Route path="/advanced/collaboration/local" element={<CollaborationLocalPage />} />
        <Route path="/advanced/collaboration/realtime" element={<CollaborationRealtimePage />} />
        <Route path="/advanced/dynamic-objects/html" element={<DynamicObjectsHtmlPage />} />
        <Route path="/advanced/dynamic-objects/component" element={<DynamicObjectsComponentPage />} />
        <Route path="/advanced/dynamic-objects/element" element={<DynamicObjectsElementPage />} />
        <Route path="/advanced/dynamic-objects/element-html" element={<DynamicObjectsElementHtmlPage />} />
        <Route path="/advanced/import-export/viewport-export" element={<ImportExportViewportExportPage />} />
        <Route path="/advanced/import-export/workspace-export" element={<ImportExportWorkspaceExportPage />} />
        <Route path="/advanced/import-export/workspace-import" element={<ImportExportWorkspaceImportPage />} />

        <Route path="/customization/theming/apply" element={<ThemingApplyPage />} />
        <Route path="/customization/theming/custom" element={<ThemingCustomPage />} />
        <Route path="/customization/fonts/register" element={<FontsRegisterPage />} />
        <Route path="/customization/icons/register" element={<IconsRegisterPage />} />
        <Route path="/customization/localization/switch" element={<LocalizationSwitchPage />} />
        <Route path="/customization/localization/custom" element={<LocalizationCustomPage />} />

        <Route path="/examples/object-explorer" element={<ObjectExplorerPage />} />
        <Route path="/examples/blueprint-defect-mapper" element={<BlueprintDefectMapperPage />} />
        <Route path="/examples/slideshow-presentation" element={<SlideshowPresentationPage />} />
        <Route path="/examples/image-annotation-studio" element={<ImageAnnotationStudioPage />} />

        <Route path="/website/hero" element={<WebsiteHeroPage />} />
        <Route path="/website/hero-mobile" element={<WebsiteHeroPageMobile />} />
        <Route path="*" element={<Navigate to="/getting-started/quick-start" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
