import { Routes } from '@angular/router';
import { QuickStartComponent } from './pages/getting-started/quick-start.component';
import { BasicUsageComponent } from './pages/getting-started/basic-usage.component';
import { UserManagementProvidersComponent } from './pages/advanced/user-management/user-management-providers.component';
import { UserManagementLoginComponent } from './pages/advanced/user-management/user-management-login.component';
import { UserManagementUsersComponent } from './pages/advanced/user-management/user-management-users.component';
import { UserManagementLogoutComponent } from './pages/advanced/user-management/user-management-logout.component';
import { ContextMenusCanvasQuickActionsComponent } from './pages/fundamentals/controls/context-menus-canvas-quick-actions.component';
import { ContextMenusClipboardActionsComponent } from './pages/fundamentals/controls/context-menus-clipboard-actions.component';
import { ContextMenusSmartConditionalComponent } from './pages/fundamentals/controls/context-menus-smart-conditional.component';
import { ContextMenusObjectInspectorComponent } from './pages/fundamentals/controls/context-menus-object-inspector.component';
import { NotificationsTriggerComponent } from './pages/fundamentals/controls/notifications-trigger.component';
import { ExportDialogComponent } from './pages/fundamentals/controls/export-dialog.component';
import { ImportDialogComponent } from './pages/fundamentals/controls/import-dialog.component';
import { WorkspaceManagerOpenComponent } from './pages/fundamentals/controls/workspace-manager-open.component';
import { MoreMenuOpenComponent } from './pages/fundamentals/controls/more-menu-open.component';
import { ToolbarUtilityPanelComponent } from './pages/fundamentals/controls/toolbar-utility-panel.component';
import { ZoomPanelToggleComponent } from './pages/fundamentals/controls/zoom-panel-toggle.component';
import { ObjectsAddComponent } from './pages/fundamentals/objects/objects-add.component';
import { ObjectsRemoveComponent } from './pages/fundamentals/objects/objects-remove.component';
import { ObjectsUpdateComponent } from './pages/fundamentals/objects/objects-update.component';
import { ObjectsFilterComponent } from './pages/fundamentals/objects/objects-filter.component';
import { ObjectsSelectionComponent } from './pages/fundamentals/objects/objects-selection.component';
import { ObjectsGroupingComponent } from './pages/fundamentals/objects/objects-grouping.component';
import { ObjectsOrderingComponent } from './pages/fundamentals/objects/objects-ordering.component';
import { ToolsChangeComponent } from './pages/fundamentals/tools/tools-change.component';
import { ToolsToolbarComponent } from './pages/fundamentals/tools/tools-toolbar.component';
import { ToolsDisableComponent } from './pages/fundamentals/tools/tools-disable.component';
import { ToolsRegisterComponent } from './pages/fundamentals/tools/tools-register.component';
import { ToolsConfigComponent } from './pages/fundamentals/tools/tools-config.component';
import { ViewportPanComponent } from './pages/fundamentals/viewport/viewport-pan.component';
import { ViewportZoomComponent } from './pages/fundamentals/viewport/viewport-zoom.component';
import { ViewportCenterComponent } from './pages/fundamentals/viewport/viewport-center.component';
import { ViewportLimitsComponent } from './pages/fundamentals/viewport/viewport-limits.component';
import { ViewportBoundariesComponent } from './pages/fundamentals/viewport/viewport-boundaries.component';
import { ViewportEventsComponent } from './pages/fundamentals/viewport/viewport-events.component';
import { WorkspacesSwitchComponent } from './pages/fundamentals/workspaces/workspaces-switch.component';
import { WorkspacesCreateComponent } from './pages/fundamentals/workspaces/workspaces-create.component';
import { WorkspacesReadComponent } from './pages/fundamentals/workspaces/workspaces-read.component';
import { WorkspacesUpdateComponent } from './pages/fundamentals/workspaces/workspaces-update.component';
import { WorkspacesDeleteComponent } from './pages/fundamentals/workspaces/workspaces-delete.component';
import { PersistenceLocalComponent } from './pages/fundamentals/persistence/persistence-local.component';
import { PersistenceMemoryComponent } from './pages/fundamentals/persistence/persistence-memory.component';
import { CollaborationLocalComponent } from './pages/advanced/collaboration/collaboration-local.component';
import { CollaborationRealtimeComponent } from './pages/advanced/collaboration/collaboration-realtime.component';
import { DynamicObjectsHtmlComponent } from './pages/advanced/dynamic-objects/dynamic-objects-html.component';
import { DynamicObjectsComponentComponent } from './pages/advanced/dynamic-objects/dynamic-objects-component.component';
import { DynamicObjectsIframeComponent } from './pages/advanced/dynamic-objects/dynamic-objects-iframe.component';
import { ImportExportViewportExportComponent } from './pages/advanced/import-export/import-export-viewport-export.component';
import { ImportExportWorkspaceExportComponent } from './pages/advanced/import-export/import-export-workspace-export.component';
import { ImportExportWorkspaceImportComponent } from './pages/advanced/import-export/import-export-workspace-import.component';
import { ThemingApplyComponent } from './pages/customization/theming/theming-apply.component';
import { ThemingCustomComponent } from './pages/customization/theming/theming-custom.component';
import { ThemingListenComponent } from './pages/customization/theming/theming-listen.component';
import { FontsRegisterComponent } from './pages/customization/fonts/fonts-register.component';
import { FontsUiFontFamilyComponent } from './pages/customization/fonts/fonts-ui-font-family.component';
import { IconsRegisterComponent } from './pages/customization/icons/icons-register.component';
import { IconsRegisterNewComponent } from './pages/customization/icons/icons-register-new.component';
import { LocalizationSwitchComponent } from './pages/customization/localization/localization-switch.component';
import { LocalizationCustomComponent } from './pages/customization/localization/localization-custom.component';
import { LocalizationListenComponent } from './pages/customization/localization/localization-listen.component';
import { ObjectExplorerComponent } from './pages/examples/object-explorer.component';
import { BlueprintDefectMapperComponent } from './pages/examples/blueprint-defect-mapper.component';
import { SlideshowPresentationComponent } from './pages/examples/slideshow-presentation.component';
import { ImageAnnotationStudioComponent } from './pages/examples/image-annotation-studio.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'getting-started/quick-start' },
  {
    path: 'demos',
    loadComponent: () => import('./pages/demo-index.component').then(module => module.DemoIndexComponent),
  },
  {
    path: 'getting-started',
    children: [
      { path: 'quick-start', component: QuickStartComponent },
      { path: 'basic-usage', component: BasicUsageComponent },
    ],
  },
  {
    path: 'fundamentals',
    children: [
      {
        path: 'controls',
        children: [
          { path: 'context-menus-canvas-quick-actions', component: ContextMenusCanvasQuickActionsComponent },
          { path: 'context-menus-clipboard-actions', component: ContextMenusClipboardActionsComponent },
          { path: 'context-menus-smart-conditional', component: ContextMenusSmartConditionalComponent },
          { path: 'context-menus-object-inspector', component: ContextMenusObjectInspectorComponent },
          { path: 'notifications-trigger', component: NotificationsTriggerComponent },
          { path: 'export-dialog', component: ExportDialogComponent },
          { path: 'import-dialog', component: ImportDialogComponent },
          { path: 'workspace-manager-open', component: WorkspaceManagerOpenComponent },
          { path: 'more-menu-open', component: MoreMenuOpenComponent },
          { path: 'toolbar-utility-panel', component: ToolbarUtilityPanelComponent },
          { path: 'zoom-panel-toggle', component: ZoomPanelToggleComponent },
        ],
      },
      {
        path: 'objects',
        children: [
          { path: 'add', component: ObjectsAddComponent },
          { path: 'remove', component: ObjectsRemoveComponent },
          { path: 'update', component: ObjectsUpdateComponent },
          { path: 'filter', component: ObjectsFilterComponent },
          { path: 'selection', component: ObjectsSelectionComponent },
          { path: 'grouping', component: ObjectsGroupingComponent },
          { path: 'ordering', component: ObjectsOrderingComponent },
        ],
      },
      {
        path: 'tools',
        children: [
          { path: 'disable', component: ToolsDisableComponent },
          { path: 'toolbar', component: ToolsToolbarComponent },
          { path: 'config', component: ToolsConfigComponent },
          { path: 'register', component: ToolsRegisterComponent },
          { path: 'change', component: ToolsChangeComponent },
        ],
      },
      {
        path: 'viewport',
        children: [
          { path: 'pan', component: ViewportPanComponent },
          { path: 'zoom', component: ViewportZoomComponent },
          { path: 'center', component: ViewportCenterComponent },
          { path: 'limits', component: ViewportLimitsComponent },
          { path: 'boundaries', component: ViewportBoundariesComponent },
          { path: 'events', component: ViewportEventsComponent },
        ],
      },
      {
        path: 'workspaces',
        children: [
          { path: 'switch', component: WorkspacesSwitchComponent },
          { path: 'create', component: WorkspacesCreateComponent },
          { path: 'read', component: WorkspacesReadComponent },
          { path: 'update', component: WorkspacesUpdateComponent },
          { path: 'delete', component: WorkspacesDeleteComponent },
        ],
      },
      {
        path: 'persistence',
        children: [
          { path: 'memory', component: PersistenceMemoryComponent },
          { path: 'local', component: PersistenceLocalComponent },
        ],
      },
    ],
  },
  {
    path: 'advanced',
    children: [
      { path: 'collaboration-local', component: CollaborationLocalComponent },
      {
        path: 'collaboration-realtime',
        component: CollaborationRealtimeComponent,
      },
      {
        path: 'user-management',
        children: [
          { path: 'providers', component: UserManagementProvidersComponent },
          { path: 'login', component: UserManagementLoginComponent },
          { path: 'users', component: UserManagementUsersComponent },
          { path: 'logout', component: UserManagementLogoutComponent },
        ],
      },
      {
        path: 'collaboration',
        children: [
          { path: 'local', component: CollaborationLocalComponent },
          { path: 'realtime', component: CollaborationRealtimeComponent },
        ],
      },
      {
        path: 'dynamic-objects',
        children: [
          { path: 'html', component: DynamicObjectsHtmlComponent },
          { path: 'component', component: DynamicObjectsComponentComponent },
          { path: 'iframe', component: DynamicObjectsIframeComponent },
        ],
      },
      {
        path: 'import-export',
        children: [
          { path: 'viewport-export', component: ImportExportViewportExportComponent },
          { path: 'workspace-export', component: ImportExportWorkspaceExportComponent },
          { path: 'workspace-import', component: ImportExportWorkspaceImportComponent },
        ],
      },
    ],
  },
  {
    path: 'customization',
    children: [
      {
        path: 'theming',
        children: [
          { path: 'apply', component: ThemingApplyComponent },
          { path: 'custom', component: ThemingCustomComponent },
          { path: 'listen', component: ThemingListenComponent },
        ],
      },
      {
        path: 'fonts',
        children: [
          { path: 'register', component: FontsRegisterComponent },
          { path: 'ui-font-family', component: FontsUiFontFamilyComponent },
        ],
      },
      {
        path: 'icons',
        children: [
          { path: 'register', component: IconsRegisterComponent },
          { path: 'register-new', component: IconsRegisterNewComponent },
        ],
      },
      {
        path: 'localization',
        children: [
          { path: 'switch', component: LocalizationSwitchComponent },
          { path: 'custom', component: LocalizationCustomComponent },
          { path: 'listen', component: LocalizationListenComponent },
        ],
      },
    ],
  },
  {
    path: 'examples',
    children: [
      { path: 'object-explorer', component: ObjectExplorerComponent },
      { path: 'blueprint-defect-mapper', component: BlueprintDefectMapperComponent },
      { path: 'slideshow-presentation', component: SlideshowPresentationComponent },
      { path: 'image-annotation-studio', component: ImageAnnotationStudioComponent },
    ],
  },
  { path: '**', redirectTo: 'getting-started/quick-start' },
];
