import { Routes } from '@angular/router';
import { EditorPageComponent } from './e2e/editor-page.component';
import { EditorHocuspocusPageComponent } from './e2e/editor-hocuspocus-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { WrappedEditorPageComponent } from './e2e/wrapped-editor-page.component';
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
import { ObjectsAddRemoveComponent } from './fundamentals/objects/objects-add-remove.component';
import { ObjectsQueryComponent } from './fundamentals/objects/objects-query.component';
import { ObjectsSelectionComponent } from './fundamentals/objects/objects-selection.component';
import { ObjectsGroupingComponent } from './fundamentals/objects/objects-grouping.component';
import { ObjectsOrderingComponent } from './fundamentals/objects/objects-ordering.component';
import { ToolsChangeComponent } from './fundamentals/tools/tools-change.component';
import { ToolsToolbarComponent } from './fundamentals/tools/tools-toolbar.component';
import { ToolsDisableComponent } from './fundamentals/tools/tools-disable.component';
import { ToolsRegisterComponent } from './fundamentals/tools/tools-register.component';
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
import { DynamicObjectsCustomElementComponent } from './advanced/dynamic-objects/dynamic-objects-custom-element.component';
import { DynamicObjectsCustomElementHtmlComponent } from './advanced/dynamic-objects/dynamic-objects-custom-element-html.component';
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
        ],
      },
      {
        path: 'objects',
        children: [
          { path: 'add-remove', component: ObjectsAddRemoveComponent },
          { path: 'query', component: ObjectsQueryComponent },
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
          { path: 'custom-element', component: DynamicObjectsCustomElementComponent },
          { path: 'custom-element-html', component: DynamicObjectsCustomElementHtmlComponent },
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
  { path: '**', redirectTo: 'e2e/editor' },
];
