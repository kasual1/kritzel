import { Routes } from '@angular/router';
import { userResolver } from './resolvers/user.resolver';
import { EditorPageComponent } from './e2e/editor-page.component';
import { EditorHocuspocusPageComponent } from './e2e/editor-hocuspocus-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { WrappedEditorPageComponent } from './e2e/wrapped-editor-page.component';
import { CustomContextMenuCanvasQuickActionsComponent } from './advanced/context-menus/custom-context-menu-canvas-quick-actions.component';
import { CustomContextMenuClipboardActionsComponent } from './advanced/context-menus/custom-context-menu-clipboard-actions.component';
import { CustomContextMenuSmartConditionalComponent } from './advanced/context-menus/custom-context-menu-smart-conditional.component';
import { CustomContextMenuObjectInspectorComponent } from './advanced/context-menus/custom-context-menu-object-inspector.component';
import { QuickstartComponent } from './getting-started/quickstart.component';
import { ObjectExplorerComponent } from './examples/object-explorer/object-explorer.component';
import { BlueprintDefectMapperComponent } from './examples/blueprint-defect-mapper/blueprint-defect-mapper.component';
import { SlideshowPresentationComponent } from './examples/slideshow-presentation/slideshow-presentation.component';
import { InfiniteCanvasGalleryComponent } from './examples/infinite-canvas-gallery/infinite-canvas-gallery.component';
import { ImageAnnotationStudioComponent } from './examples/image-annotation-studio/image-annotation-studio.component';
import { ThemingApplyComponent } from './advanced/customization/theming/theming-apply.component';
import { ThemingCustomComponent } from './advanced/customization/theming/theming-custom.component';
import { CollaborationLocalComponent } from './advanced/collaboration/collaboration-local.component';
import { CollaborationRealtimeComponent } from './advanced/collaboration/collaboration-realtime.component';
import { CollaborationLocalComponent as PersistenceLocalComponent } from './fundamentals/persistence/persistence-local.component';
import { ComponentsEditorComponent } from './fundamentals/components/components-editor.component';
import { ComponentsEditorUiComponent } from './fundamentals/components/components-editor-ui.component';
import { ComponentsEngineComponent } from './fundamentals/components/components-engine.component';
import { ObjectsAddRemoveComponent } from './fundamentals/objects/objects-add-remove.component';
import { ObjectsQueryComponent } from './fundamentals/objects/objects-query.component';
import { ObjectsSelectionComponent } from './fundamentals/objects/objects-selection.component';
import { ObjectsGroupingComponent } from './fundamentals/objects/objects-grouping.component';
import { ViewportChangeComponent } from './fundamentals/viewport/viewport-change.component';
import { ViewportCenterComponent } from './fundamentals/viewport/viewport-center.component';
import { ViewportCoordinatesComponent } from './fundamentals/viewport/viewport-coordinates.component';
import { ToolsChangeComponent } from './fundamentals/tools/tools-change.component';
import { ToolsControlsComponent } from './fundamentals/tools/tools-controls.component';
import { ToolsDisableComponent } from './fundamentals/tools/tools-disable.component';
import { ToolsRegisterComponent } from './fundamentals/tools/tools-register.component';
import { WorkspacesSwitchComponent } from './fundamentals/workspaces/workspaces-switch.component';
import { WorkspacesCrudComponent } from './fundamentals/workspaces/workspaces-crud.component';
import { ObjectsOrderingComponent } from './fundamentals/objects/objects-ordering.component';
import { BasicUsageComponent } from './basic-usage/basic-usage.component';
import { EditorPageCustomElementComponent } from './fundamentals/custom-elements/editor-page-custom-element.component';
import { EditorPageCustomElementHtmlComponent } from './fundamentals/custom-elements/editor-page-custom-element-html.component';
import { LocalizationSwitchComponent } from './advanced/localization/localization-switch.component';
import { LocalizationCustomComponent } from './advanced/localization/localization-custom.component';
import { FontsRegisterComponent } from './advanced/customization/fonts/fonts-register.component';
import { IconsRegisterComponent } from './advanced/customization/icons/icons-register.component';
import { UserManagementProvidersComponent } from './advanced/user-management/user-management-providers.component';
import { UserManagementFlowComponent } from './advanced/user-management/user-management-flow.component';
import { DynamicObjectsHtmlComponent } from './advanced/dynamic-objects/dynamic-objects-html.component';
import { DynamicObjectsComponentComponent } from './advanced/dynamic-objects/dynamic-objects-component.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'e2e/editor' },
  {
    path: 'e2e',
    children: [
      { path: 'editor', component: EditorPageComponent },
      { path: 'editor-hocuspocus', component: EditorHocuspocusPageComponent },
      { path: 'multi-editor', component: MultiEditorPageComponent },
      { path: 'wrapped-editor', component: WrappedEditorPageComponent },
    ],
  },
  {
    path: 'basic-usage',
    component: BasicUsageComponent,
  },
  {
    path: 'getting-started',
    component: QuickstartComponent,
  },
  {
    path: 'fundamentals',
    children: [
      { path: 'collaboration-local', component: CollaborationLocalComponent },
      { path: 'persistence-local', component: PersistenceLocalComponent },
      {
        path: 'collaboration-realtime',
        component: CollaborationRealtimeComponent,
      },
      { path: 'components-editor', component: ComponentsEditorComponent },
      { path: 'components-editor-ui', component: ComponentsEditorUiComponent },
      { path: 'components-engine', component: ComponentsEngineComponent },
      { path: 'objects-add-remove', component: ObjectsAddRemoveComponent },
      { path: 'objects-query', component: ObjectsQueryComponent },
      { path: 'objects-selection', component: ObjectsSelectionComponent },
      { path: 'objects-grouping', component: ObjectsGroupingComponent },
      { path: 'objects-ordering', component: ObjectsOrderingComponent },
      { path: 'viewport-change', component: ViewportChangeComponent },
      { path: 'viewport-center', component: ViewportCenterComponent },
      { path: 'viewport-coordinates', component: ViewportCoordinatesComponent },
      { path: 'tools-change', component: ToolsChangeComponent },
      { path: 'tools-controls', component: ToolsControlsComponent },
      { path: 'tools-disable', component: ToolsDisableComponent },
      { path: 'tools-register', component: ToolsRegisterComponent },
      { path: 'workspaces-switch', component: WorkspacesSwitchComponent },
      { path: 'workspaces-crud', component: WorkspacesCrudComponent },
      { path: 'custom-elements', component: EditorPageCustomElementComponent },
      {
        path: 'custom-elements-html',
        component: EditorPageCustomElementHtmlComponent,
      },
    ],
  },
  {
    path: 'advanced',
    children: [
      {
        path: 'context-menus-canvas-quick-actions',
        component: CustomContextMenuCanvasQuickActionsComponent,
      },
      {
        path: 'context-menus-clipboard-actions',
        component: CustomContextMenuClipboardActionsComponent,
      },
      {
        path: 'context-menus-smart-conditional',
        component: CustomContextMenuSmartConditionalComponent,
      },
      {
        path: 'context-menus-object-inspector',
        component: CustomContextMenuObjectInspectorComponent,
      },
      {
        path: 'customization',
        children: [
          { path: 'theming-apply', component: ThemingApplyComponent },
          { path: 'theming-custom', component: ThemingCustomComponent },
          { path: 'fonts-register', component: FontsRegisterComponent },
          { path: 'icons', component: IconsRegisterComponent },
        ],
      },
      { path: 'localization-switch', component: LocalizationSwitchComponent },
      { path: 'localization-custom', component: LocalizationCustomComponent },
      { path: 'user-management-providers', component: UserManagementProvidersComponent },
      { path: 'user-management-flow', component: UserManagementFlowComponent },
      { path: 'dynamic-objects-html', component: DynamicObjectsHtmlComponent },
      { path: 'dynamic-objects-component', component: DynamicObjectsComponentComponent },
    ],
  },
  {
    path: 'examples',
    children: [
      { path: 'object-explorer', component: ObjectExplorerComponent },
      {
        path: 'blueprint-defect-mapper',
        component: BlueprintDefectMapperComponent,
      },
      {
        path: 'workspace-management-url-synced',
        children: [],
      },
      {
        path: 'slideshow-presentation',
        component: SlideshowPresentationComponent,
      },
      {
        path: 'infinite-canvas-gallery',
        component: InfiniteCanvasGalleryComponent,
      },
      {
        path: 'image-annotation-studio',
        component: ImageAnnotationStudioComponent,
      },
      {
        path: 'collaboration-1',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: CollaborationLocalComponent,
            resolve: { user: userResolver },
          },
          {
            path: ':workspaceId',
            component: CollaborationLocalComponent,
            resolve: { user: userResolver },
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'e2e' },
];
