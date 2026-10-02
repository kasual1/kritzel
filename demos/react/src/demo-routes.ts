import type { ComponentType } from "react";
import { CollaborationLocalPage } from "./pages/advanced/collaboration/CollaborationLocalPage";
import { CollaborationRealtimePage } from "./pages/advanced/collaboration/CollaborationRealtimePage";
import { DynamicObjectsComponentPage } from "./pages/advanced/dynamic-objects/DynamicObjectsComponentPage";
import { DynamicObjectsHtmlPage } from "./pages/advanced/dynamic-objects/DynamicObjectsHtmlPage";
import { DynamicObjectsIframePage } from "./pages/advanced/dynamic-objects/DynamicObjectsIframePage";
import { ImportExportViewportExportPage } from "./pages/advanced/import-export/ImportExportViewportExportPage";
import { ImportExportWorkspaceExportPage } from "./pages/advanced/import-export/ImportExportWorkspaceExportPage";
import { ImportExportWorkspaceImportPage } from "./pages/advanced/import-export/ImportExportWorkspaceImportPage";
import { UserManagementLoginPage } from "./pages/advanced/user-management/UserManagementLoginPage";
import { UserManagementLogoutPage } from "./pages/advanced/user-management/UserManagementLogoutPage";
import { UserManagementProvidersPage } from "./pages/advanced/user-management/UserManagementProvidersPage";
import { UserManagementUsersPage } from "./pages/advanced/user-management/UserManagementUsersPage";
import { FontsRegisterPage } from "./pages/customization/fonts/FontsRegisterPage";
import { FontsUiFontFamilyPage } from "./pages/customization/fonts/FontsUiFontFamilyPage";
import { IconsRegisterNewPage } from "./pages/customization/icons/IconsRegisterNewPage";
import { IconsRegisterPage } from "./pages/customization/icons/IconsRegisterPage";
import { LocalizationCustomPage } from "./pages/customization/localization/LocalizationCustomPage";
import { LocalizationListenPage } from "./pages/customization/localization/LocalizationListenPage";
import { LocalizationSwitchPage } from "./pages/customization/localization/LocalizationSwitchPage";
import { ThemingApplyPage } from "./pages/customization/theming/ThemingApplyPage";
import { ThemingCustomPage } from "./pages/customization/theming/ThemingCustomPage";
import { ThemingListenPage } from "./pages/customization/theming/ThemingListenPage";
import { BlueprintDefectMapperPage } from "./pages/examples/BlueprintDefectMapperPage";
import { ImageAnnotationStudioPage } from "./pages/examples/ImageAnnotationStudioPage";
import { ObjectExplorerPage } from "./pages/examples/ObjectExplorerPage";
import { SlideshowPresentationPage } from "./pages/examples/SlideshowPresentationPage";
import { ExportDialogPage } from "./pages/fundamentals/controls/ExportDialogPage";
import { ImportDialogPage } from "./pages/fundamentals/controls/ImportDialogPage";
import { ContextMenusCanvasQuickActionsPage } from "./pages/fundamentals/controls/ContextMenusCanvasQuickActionsPage";
import { ContextMenusClipboardActionsPage } from "./pages/fundamentals/controls/ContextMenusClipboardActionsPage";
import { ContextMenusObjectInspectorPage } from "./pages/fundamentals/controls/ContextMenusObjectInspectorPage";
import { ContextMenusSmartConditionalPage } from "./pages/fundamentals/controls/ContextMenusSmartConditionalPage";
import { MoreMenuOpenPage } from "./pages/fundamentals/controls/MoreMenuOpenPage";
import { NotificationsTriggerPage } from "./pages/fundamentals/controls/NotificationsTriggerPage";
import { ToolbarUtilityPanelPage } from "./pages/fundamentals/controls/ToolbarUtilityPanelPage";
import { WorkspaceManagerOpenPage } from "./pages/fundamentals/controls/WorkspaceManagerOpenPage";
import { ZoomPanelTogglePage } from "./pages/fundamentals/controls/ZoomPanelTogglePage";
import { ObjectsAddPage } from "./pages/fundamentals/objects/ObjectsAddPage";
import { ObjectsFilterPage } from "./pages/fundamentals/objects/ObjectsFilterPage";
import { ObjectsGroupingPage } from "./pages/fundamentals/objects/ObjectsGroupingPage";
import { ObjectsOrderingPage } from "./pages/fundamentals/objects/ObjectsOrderingPage";
import { ObjectsRemovePage } from "./pages/fundamentals/objects/ObjectsRemovePage";
import { ObjectsSelectionPage } from "./pages/fundamentals/objects/ObjectsSelectionPage";
import { ObjectsUpdatePage } from "./pages/fundamentals/objects/ObjectsUpdatePage";
import { PersistenceLocalPage } from "./pages/fundamentals/persistence/PersistenceLocalPage";
import { PersistenceMemoryPage } from "./pages/fundamentals/persistence/PersistenceMemoryPage";
import { ToolsChangePage } from "./pages/fundamentals/tools/ToolsChangePage";
import { ToolsConfigPage } from "./pages/fundamentals/tools/ToolsConfigPage";
import { ToolsDisablePage } from "./pages/fundamentals/tools/ToolsDisablePage";
import { ToolsRegisterPage } from "./pages/fundamentals/tools/ToolsRegisterPage";
import { ToolsToolbarPage } from "./pages/fundamentals/tools/ToolsToolbarPage";
import { ViewportBoundariesPage } from "./pages/fundamentals/viewport/ViewportBoundariesPage";
import { ViewportCenterPage } from "./pages/fundamentals/viewport/ViewportCenterPage";
import { ViewportEventsPage } from "./pages/fundamentals/viewport/ViewportEventsPage";
import { ViewportLimitsPage } from "./pages/fundamentals/viewport/ViewportLimitsPage";
import { ViewportPanPage } from "./pages/fundamentals/viewport/ViewportPanPage";
import { ViewportZoomPage } from "./pages/fundamentals/viewport/ViewportZoomPage";
import { WorkspacesCreatePage } from "./pages/fundamentals/workspaces/WorkspacesCreatePage";
import { WorkspacesDeletePage } from "./pages/fundamentals/workspaces/WorkspacesDeletePage";
import { WorkspacesReadPage } from "./pages/fundamentals/workspaces/WorkspacesReadPage";
import { WorkspacesSwitchPage } from "./pages/fundamentals/workspaces/WorkspacesSwitchPage";
import { WorkspacesUpdatePage } from "./pages/fundamentals/workspaces/WorkspacesUpdatePage";
import { BasicUsagePage } from "./pages/getting-started/BasicUsagePage";
import { QuickStartPage } from "./pages/getting-started/QuickStartPage";

export interface DemoRoute {
  path: string;
  title: string;
  category: string;
  component: ComponentType;
  context?: string;
  isIndexed?: boolean;
}

export const demoRoutes: readonly DemoRoute[] = [
  { path: "/getting-started/quick-start", title: "Quick Start", category: "Getting Started", component: QuickStartPage },
  { path: "/getting-started/basic-usage", title: "Basic Usage", category: "Getting Started", component: BasicUsagePage },

  { path: "/fundamentals/controls/context-menus-canvas-quick-actions", title: "Canvas Quick Actions", category: "Fundamentals", context: "Controls", component: ContextMenusCanvasQuickActionsPage },
  { path: "/fundamentals/controls/context-menus-clipboard-actions", title: "Clipboard Actions", category: "Fundamentals", context: "Controls", component: ContextMenusClipboardActionsPage },
  { path: "/fundamentals/controls/context-menus-smart-conditional", title: "Smart Conditional Menu", category: "Fundamentals", context: "Controls", component: ContextMenusSmartConditionalPage },
  { path: "/fundamentals/controls/context-menus-object-inspector", title: "Object Inspector", category: "Fundamentals", context: "Controls", component: ContextMenusObjectInspectorPage },
  { path: "/fundamentals/controls/notifications-trigger", title: "Trigger Notifications", category: "Fundamentals", context: "Controls", component: NotificationsTriggerPage },
  { path: "/fundamentals/controls/export-dialog", title: "Export Dialog", category: "Fundamentals", context: "Controls", component: ExportDialogPage },
  { path: "/fundamentals/controls/import-dialog", title: "Import Dialog", category: "Fundamentals", context: "Controls", component: ImportDialogPage },
  { path: "/fundamentals/controls/workspace-manager-open", title: "Workspace Manager", category: "Fundamentals", context: "Controls", component: WorkspaceManagerOpenPage },
  { path: "/fundamentals/controls/more-menu-open", title: "More Menu", category: "Fundamentals", context: "Controls", component: MoreMenuOpenPage },
  { path: "/fundamentals/controls/toolbar-utility-panel", title: "Toolbar Utility Panel", category: "Fundamentals", context: "Controls", component: ToolbarUtilityPanelPage },
  { path: "/fundamentals/controls/zoom-panel-toggle", title: "Zoom Panel", category: "Fundamentals", context: "Controls", component: ZoomPanelTogglePage },

  { path: "/fundamentals/objects/add", title: "Add Objects", category: "Fundamentals", context: "Objects", component: ObjectsAddPage },
  { path: "/fundamentals/objects/remove", title: "Remove Objects", category: "Fundamentals", context: "Objects", component: ObjectsRemovePage },
  { path: "/fundamentals/objects/update", title: "Update Objects", category: "Fundamentals", context: "Objects", component: ObjectsUpdatePage },
  { path: "/fundamentals/objects/filter", title: "Filter Objects", category: "Fundamentals", context: "Objects", component: ObjectsFilterPage },
  { path: "/fundamentals/objects/selection", title: "Object Selection", category: "Fundamentals", context: "Objects", component: ObjectsSelectionPage },
  { path: "/fundamentals/objects/grouping", title: "Object Grouping", category: "Fundamentals", context: "Objects", component: ObjectsGroupingPage },
  { path: "/fundamentals/objects/ordering", title: "Object Ordering", category: "Fundamentals", context: "Objects", component: ObjectsOrderingPage },

  { path: "/fundamentals/tools/disable", title: "Disable Tools", category: "Fundamentals", context: "Tools", component: ToolsDisablePage },
  { path: "/fundamentals/tools/toolbar", title: "Toolbar", category: "Fundamentals", context: "Tools", component: ToolsToolbarPage },
  { path: "/fundamentals/tools/config", title: "Tool Configuration", category: "Fundamentals", context: "Tools", component: ToolsConfigPage },
  { path: "/fundamentals/tools/register", title: "Register Tools", category: "Fundamentals", context: "Tools", component: ToolsRegisterPage },
  { path: "/fundamentals/tools/change", title: "Change Tools", category: "Fundamentals", context: "Tools", component: ToolsChangePage },

  { path: "/fundamentals/viewport/pan", title: "Pan", category: "Fundamentals", context: "Viewport", component: ViewportPanPage },
  { path: "/fundamentals/viewport/zoom", title: "Zoom", category: "Fundamentals", context: "Viewport", component: ViewportZoomPage },
  { path: "/fundamentals/viewport/center", title: "Center", category: "Fundamentals", context: "Viewport", component: ViewportCenterPage },
  { path: "/fundamentals/viewport/limits", title: "Scale Limits", category: "Fundamentals", context: "Viewport", component: ViewportLimitsPage },
  { path: "/fundamentals/viewport/boundaries", title: "Boundaries", category: "Fundamentals", context: "Viewport", component: ViewportBoundariesPage },
  { path: "/fundamentals/viewport/events", title: "Viewport Events", category: "Fundamentals", context: "Viewport", component: ViewportEventsPage },

  { path: "/fundamentals/workspaces/switch", title: "Switch Workspaces", category: "Fundamentals", context: "Workspaces", component: WorkspacesSwitchPage },
  { path: "/fundamentals/workspaces/create", title: "Create Workspace", category: "Fundamentals", context: "Workspaces", component: WorkspacesCreatePage },
  { path: "/fundamentals/workspaces/read", title: "Read Workspaces", category: "Fundamentals", context: "Workspaces", component: WorkspacesReadPage },
  { path: "/fundamentals/workspaces/update", title: "Update Workspace", category: "Fundamentals", context: "Workspaces", component: WorkspacesUpdatePage },
  { path: "/fundamentals/workspaces/delete", title: "Delete Workspace", category: "Fundamentals", context: "Workspaces", component: WorkspacesDeletePage },
  { path: "/fundamentals/persistence/memory", title: "Memory Persistence", category: "Fundamentals", context: "Persistence", component: PersistenceMemoryPage },
  { path: "/fundamentals/persistence/local", title: "Local Persistence", category: "Fundamentals", context: "Persistence", component: PersistenceLocalPage },

  { path: "/advanced/collaboration-local", title: "Local Collaboration", category: "Advanced", component: CollaborationLocalPage, isIndexed: false },
  { path: "/advanced/collaboration-realtime", title: "Realtime Collaboration", category: "Advanced", component: CollaborationRealtimePage, isIndexed: false },
  { path: "/advanced/user-management/providers", title: "User Providers", category: "Advanced", context: "User Management", component: UserManagementProvidersPage },
  { path: "/advanced/user-management/login", title: "Login", category: "Advanced", context: "User Management", component: UserManagementLoginPage },
  { path: "/advanced/user-management/users", title: "Users", category: "Advanced", context: "User Management", component: UserManagementUsersPage },
  { path: "/advanced/user-management/logout", title: "Logout", category: "Advanced", context: "User Management", component: UserManagementLogoutPage },
  { path: "/advanced/collaboration/local", title: "Local Collaboration", category: "Advanced", context: "Collaboration", component: CollaborationLocalPage },
  { path: "/advanced/collaboration/realtime", title: "Realtime Collaboration", category: "Advanced", context: "Collaboration", component: CollaborationRealtimePage },
  { path: "/advanced/dynamic-objects/html", title: "HTML Dynamic Objects", category: "Advanced", context: "Dynamic Objects", component: DynamicObjectsHtmlPage },
  { path: "/advanced/dynamic-objects/component", title: "React Dynamic Objects", category: "Advanced", context: "Dynamic Objects", component: DynamicObjectsComponentPage },
  { path: "/advanced/dynamic-objects/iframe", title: "Iframe Dynamic Objects", category: "Advanced", context: "Dynamic Objects", component: DynamicObjectsIframePage },
  { path: "/advanced/import-export/viewport-export", title: "Viewport Export", category: "Advanced", context: "Import / Export", component: ImportExportViewportExportPage },
  { path: "/advanced/import-export/workspace-export", title: "Workspace Export", category: "Advanced", context: "Import / Export", component: ImportExportWorkspaceExportPage },
  { path: "/advanced/import-export/workspace-import", title: "Workspace Import", category: "Advanced", context: "Import / Export", component: ImportExportWorkspaceImportPage },

  { path: "/customization/theming/apply", title: "Apply Themes", category: "Customization", context: "Theming", component: ThemingApplyPage },
  { path: "/customization/theming/custom", title: "Custom Themes", category: "Customization", context: "Theming", component: ThemingCustomPage },
  { path: "/customization/theming/listen", title: "Theme Events", category: "Customization", context: "Theming", component: ThemingListenPage },
  { path: "/customization/fonts/register", title: "Register Fonts", category: "Customization", context: "Fonts", component: FontsRegisterPage },
  { path: "/customization/fonts/ui-font-family", title: "UI Font Family", category: "Customization", context: "Fonts", component: FontsUiFontFamilyPage },
  { path: "/customization/icons/register", title: "Register Icons", category: "Customization", context: "Icons", component: IconsRegisterPage },
  { path: "/customization/icons/register-new", title: "Register New Icons", category: "Customization", context: "Icons", component: IconsRegisterNewPage },
  { path: "/customization/localization/switch", title: "Switch Locale", category: "Customization", context: "Localization", component: LocalizationSwitchPage },
  { path: "/customization/localization/custom", title: "Custom Locale", category: "Customization", context: "Localization", component: LocalizationCustomPage },
  { path: "/customization/localization/listen", title: "Locale Events", category: "Customization", context: "Localization", component: LocalizationListenPage },

  { path: "/examples/object-explorer", title: "Object Explorer", category: "Examples", component: ObjectExplorerPage },
  { path: "/examples/blueprint-defect-mapper", title: "Blueprint Defect Mapper", category: "Examples", component: BlueprintDefectMapperPage },
  { path: "/examples/slideshow-presentation", title: "Slideshow Presentation", category: "Examples", component: SlideshowPresentationPage },
  { path: "/examples/image-annotation-studio", title: "Image Annotation Studio", category: "Examples", component: ImageAnnotationStudioPage },
];