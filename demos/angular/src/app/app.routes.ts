import { Routes } from '@angular/router';
import { QuickStartComponent } from './getting-started/quick-start.component';
import { BasicUsageComponent } from './getting-started/basic-usage.component';
import { ComponentsEditorComponent } from './fundamentals/components/components-editor.component';
import { ComponentsEditorUiComponent } from './fundamentals/components/components-editor-ui.component';
import { ComponentsEngineComponent } from './fundamentals/components/components-engine.component';
import { UserManagementProvidersComponent } from './fundamentals/components/user-management-providers.component';
import { UserManagementFlowComponent } from './fundamentals/components/user-management-flow.component';
import { ContextMenusCanvasQuickActionsComponent } from './fundamentals/components/context-menus-canvas-quick-actions.component';
import { ContextMenusClipboardActionsComponent } from './fundamentals/components/context-menus-clipboard-actions.component';
import { ContextMenusSmartConditionalComponent } from './fundamentals/components/context-menus-smart-conditional.component';
import { ContextMenusObjectInspectorComponent } from './fundamentals/components/context-menus-object-inspector.component';
import { NotificationsTriggerComponent } from './fundamentals/components/notifications-trigger.component';
import { WorkspaceManagerOpenComponent } from './fundamentals/components/workspace-manager-open.component';
import { MoreMenuOpenComponent } from './fundamentals/components/more-menu-open.component';
import { ToolbarUtilityPanelComponent } from './fundamentals/components/toolbar-utility-panel.component';
import { ZoomPanelToggleComponent } from './fundamentals/components/zoom-panel-toggle.component';
import { ObjectsAddComponent } from './fundamentals/objects/objects-add.component';
import { ObjectsRemoveComponent } from './fundamentals/objects/objects-remove.component';
import { ObjectsUpdateComponent } from './fundamentals/objects/objects-update.component';
import { ObjectsFilterComponent } from './fundamentals/objects/objects-filter.component';
import { ObjectsSelectionComponent } from './fundamentals/objects/objects-selection.component';
import { ObjectsGroupingComponent } from './fundamentals/objects/objects-grouping.component';
import { ObjectsOrderingComponent } from './fundamentals/objects/objects-ordering.component';
import { ToolsChangeComponent } from './fundamentals/tools/tools-change.component';
import { ToolsToolbarComponent } from './fundamentals/tools/tools-toolbar.component';
import { ToolsDisableComponent } from './fundamentals/tools/tools-disable.component';
import { ToolsRegisterComponent } from './fundamentals/tools/tools-register.component';
import { ToolsConfigComponent } from './fundamentals/tools/tools-config.component';
import { ViewportChangeComponent } from './fundamentals/viewport/viewport-change.component';
import { ViewportCenterComponent } from './fundamentals/viewport/viewport-center.component';
import { ViewportCoordinatesComponent } from './fundamentals/viewport/viewport-coordinates.component';
import { WorkspacesSwitchComponent } from './fundamentals/workspaces/workspaces-switch.component';
import { WorkspacesCrudComponent } from './fundamentals/workspaces/workspaces-crud.component';
import { PersistenceLocalComponent } from './fundamentals/persistence/persistence-local.component';
import { CollaborationLocalComponent } from './advanced/collaboration/collaboration-local.component';
import { CollaborationRealtimeComponent } from './advanced/collaboration/collaboration-realtime.component';
import { DynamicObjectsHtmlComponent } from './advanced/dynamic-objects/dynamic-objects-html.component';
import { DynamicObjectsComponentComponent } from './advanced/dynamic-objects/dynamic-objects-component.component';
import { DynamicObjectsElementComponent } from './advanced/dynamic-objects/dynamic-objects-element.component';
import { DynamicObjectsElementHtmlComponent } from './advanced/dynamic-objects/dynamic-objects-element-html.component';
import { ImportExportViewportExportComponent } from './advanced/import-export/import-export-viewport-export.component';
import { ImportExportWorkspaceExportComponent } from './advanced/import-export/import-export-workspace-export.component';
import { ImportExportWorkspaceImportComponent } from './advanced/import-export/import-export-workspace-import.component';
import { ThemingApplyComponent } from './customization/theming/theming-apply.component';
import { ThemingCustomComponent } from './customization/theming/theming-custom.component';
import { FontsRegisterComponent } from './customization/fonts/fonts-register.component';
import { IconsRegisterComponent } from './customization/icons/icons-register.component';
import { LocalizationSwitchComponent } from './customization/localization/localization-switch.component';
import { LocalizationCustomComponent } from './customization/localization/localization-custom.component';
import { ObjectExplorerComponent } from './examples/object-explorer.component';
import { BlueprintDefectMapperComponent } from './examples/blueprint-defect-mapper.component';
import { SlideshowPresentationComponent } from './examples/slideshow-presentation.component';
import { InfiniteCanvasGalleryComponent } from './examples/infinite-canvas-gallery.component';
import { ImageAnnotationStudioComponent } from './examples/image-annotation-studio.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'getting-started/quick-start' },
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
        path: 'components',
        children: [
          { path: 'editor', component: ComponentsEditorComponent },
          { path: 'editor-ui', component: ComponentsEditorUiComponent },
          { path: 'engine', component: ComponentsEngineComponent },
          { path: 'user-management-providers', component: UserManagementProvidersComponent },
          { path: 'user-management-flow', component: UserManagementFlowComponent },
          { path: 'context-menus-canvas-quick-actions', component: ContextMenusCanvasQuickActionsComponent },
          { path: 'context-menus-clipboard-actions', component: ContextMenusClipboardActionsComponent },
          { path: 'context-menus-smart-conditional', component: ContextMenusSmartConditionalComponent },
          { path: 'context-menus-object-inspector', component: ContextMenusObjectInspectorComponent },
          { path: 'notifications-trigger', component: NotificationsTriggerComponent },
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
          { path: 'change', component: ViewportChangeComponent },
          { path: 'center', component: ViewportCenterComponent },
          { path: 'coordinates', component: ViewportCoordinatesComponent },
        ],
      },
      {
        path: 'workspaces',
        children: [
          { path: 'switch', component: WorkspacesSwitchComponent },
          { path: 'crud', component: WorkspacesCrudComponent },
        ],
      },
      {
        path: 'persistence',
        children: [{ path: 'local', component: PersistenceLocalComponent }],
      },
    ],
  },
  {
    path: 'advanced',
    children: [
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
          { path: 'element', component: DynamicObjectsElementComponent },
          { path: 'element-html', component: DynamicObjectsElementHtmlComponent },
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
        ],
      },
      {
        path: 'fonts',
        children: [{ path: 'register', component: FontsRegisterComponent }],
      },
      {
        path: 'icons',
        children: [{ path: 'register', component: IconsRegisterComponent }],
      },
      {
        path: 'localization',
        children: [
          { path: 'switch', component: LocalizationSwitchComponent },
          { path: 'custom', component: LocalizationCustomComponent },
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
      { path: 'infinite-canvas-gallery', component: InfiniteCanvasGalleryComponent },
      { path: 'image-annotation-studio', component: ImageAnnotationStudioComponent },
    ],
  },
  { path: '**', redirectTo: 'getting-started/quick-start' },
];
