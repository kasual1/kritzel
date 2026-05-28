import { Routes } from '@angular/router';
import { CustomToolbarAnnotationComponent } from './examples/custom-toolbar/custom-toolbar-annotation.component';
import { userResolver } from './resolvers/user.resolver';
import { CustomToolbarDiagrammingComponent } from './examples/custom-toolbar/custom-toolbar-diagramming.component';
import { CustomToolbarFullDrawingAppComponent } from './examples/custom-toolbar/custom-toolbar-full-drawing-app.component';
import { CustomToolbarExternalComponent } from './examples/custom-toolbar/custom-toolbar-external.component';
import { EditorPageComponent } from './e2e/editor-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { WrappedEditorPageComponent } from './e2e/wrapped-editor-page.component';
import { CustomContextMenuCanvasQuickActionsComponent } from './examples/custom-context-menu/custom-context-menu-canvas-quick-actions.component';
import { CustomContextMenuClipboardActionsComponent } from './examples/custom-context-menu/custom-context-menu-clipboard-actions.component';
import { CustomContextMenuSmartConditionalComponent } from './examples/custom-context-menu/custom-context-menu-smart-conditional.component';
import { CustomContextMenuObjectInspectorComponent } from './examples/custom-context-menu/custom-context-menu-object-inspector.component';
import { ObjectManagementReadOnlyInspectorComponent } from './examples/object-management/object-management-read-only-inspector.component';
import { ObjectManagementInteractiveLayerPanelComponent } from './examples/object-management/object-management-interactive-layer-panel.component';
import { ObjectManagementFilteredExplorerComponent } from './examples/object-management/object-management-filtered-explorer.component';
import { Collaboration1Component } from './examples/collaboration/collaboration-1.component';
import { ThemingBrandAccentComponent } from './examples/theming/theming-brand-accent.component';
import { ThemingFullLightComponent } from './examples/theming/theming-full-light.component';
import { ThemingLightDarkPairComponent } from './examples/theming/theming-light-dark-pair.component';
import { ThemingBrandedToolsComponent } from './examples/theming/theming-branded-tools.component';
import { ThemingHostSyncComponent } from './examples/theming/theming-host-sync.component';
import { ViewportNavigationZoomDashboardComponent } from './examples/viewport-navigation/viewport-navigation-zoom-dashboard.component';
import { ViewportNavigationObjectFocusComponent } from './examples/viewport-navigation/viewport-navigation-object-focus.component';
import { ViewportNavigationBoundedCanvasComponent } from './examples/viewport-navigation/viewport-navigation-bounded-canvas.component';
import { ViewportNavigationClickToZoomComponent } from './examples/viewport-navigation/viewport-navigation-click-to-zoom.component';
import { WorkspaceManagementTabBarComponent } from './examples/workspace-management/workspace-management-tab-bar.component';
import { WorkspaceManagementCrudPanelComponent } from './examples/workspace-management/workspace-management-crud-panel.component';
import { WorkspaceManagementUrlSyncedComponent } from './examples/workspace-management/workspace-management-url-synced.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'e2e/editor' },
  {
    path: 'e2e',
    children: [
      { path: 'editor', component: EditorPageComponent },
      { path: 'multi-editor', component: MultiEditorPageComponent },
      { path: 'wrapped-editor', component: WrappedEditorPageComponent },
    ],
  },
  {
    path: 'examples',
    children: [
      { path: 'custom-toolbar-annotation', component: CustomToolbarAnnotationComponent },
      { path: 'custom-toolbar-diagramming', component: CustomToolbarDiagrammingComponent },
      { path: 'custom-toolbar-full-drawing-app', component: CustomToolbarFullDrawingAppComponent },
      { path: 'custom-toolbar-external', component: CustomToolbarExternalComponent },
      { path: 'custom-context-menu-canvas-quick-actions', component: CustomContextMenuCanvasQuickActionsComponent },
      { path: 'custom-context-menu-clipboard-actions', component: CustomContextMenuClipboardActionsComponent },
      { path: 'custom-context-menu-smart-conditional', component: CustomContextMenuSmartConditionalComponent },
      { path: 'custom-context-menu-object-inspector', component: CustomContextMenuObjectInspectorComponent },
      { path: 'object-management-read-only-inspector', component: ObjectManagementReadOnlyInspectorComponent },
      { path: 'object-management-interactive-layer-panel', component: ObjectManagementInteractiveLayerPanelComponent },
      { path: 'object-management-filtered-explorer', component: ObjectManagementFilteredExplorerComponent },
      { path: 'theming-brand-accent', component: ThemingBrandAccentComponent },
      { path: 'theming-full-light', component: ThemingFullLightComponent },
      { path: 'theming-light-dark-pair', component: ThemingLightDarkPairComponent },
      { path: 'theming-branded-tools', component: ThemingBrandedToolsComponent },
      { path: 'theming-host-sync', component: ThemingHostSyncComponent },
      { path: 'viewport-navigation-zoom-dashboard', component: ViewportNavigationZoomDashboardComponent },
      { path: 'viewport-navigation-object-focus', component: ViewportNavigationObjectFocusComponent },
      { path: 'viewport-navigation-bounded-canvas', component: ViewportNavigationBoundedCanvasComponent },
      { path: 'viewport-navigation-click-to-zoom', component: ViewportNavigationClickToZoomComponent },
      { path: 'workspace-management-tab-bar', component: WorkspaceManagementTabBarComponent },
      { path: 'workspace-management-crud-panel', component: WorkspaceManagementCrudPanelComponent },
      {
        path: 'workspace-management-url-synced',
        children: [
          { path: '', pathMatch: 'full', component: WorkspaceManagementUrlSyncedComponent },
          { path: ':workspaceId', component: WorkspaceManagementUrlSyncedComponent },
        ],
      },
      {
        path: 'collaboration-1',
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: Collaboration1Component,
            resolve: { user: userResolver },
          },
          {
            path: ':workspaceId',
            component: Collaboration1Component,
            resolve: { user: userResolver },
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'e2e' },
];
