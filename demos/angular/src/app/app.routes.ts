import { Routes } from '@angular/router';
import { CustomToolbarAnnotationComponent } from './examples/custom-toolbar/custom-toolbar-annotation.component';
import { userResolver } from './resolvers/user.resolver';
import { CustomToolbarDiagrammingComponent } from './examples/custom-toolbar/custom-toolbar-diagramming.component';
import { CustomToolbarFullDrawingAppComponent } from './examples/custom-toolbar/custom-toolbar-full-drawing-app.component';
import { CustomToolbarExternalComponent } from './examples/custom-toolbar/custom-toolbar-external.component';
import { EditorPageComponent } from './e2e/editor-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { CustomContextMenu1Component } from './examples/custom-context-menu/custom-context-menu-1.component';
import { CustomContextMenu2Component } from './examples/custom-context-menu/custom-context-menu-2.component';
import { CustomContextMenu3Component } from './examples/custom-context-menu/custom-context-menu-3.component';
import { CustomContextMenu4Component } from './examples/custom-context-menu/custom-context-menu-4.component';
import { CustomContextMenu5Component } from './examples/custom-context-menu/custom-context-menu-5.component';
import { CustomContextMenu6Component } from './examples/custom-context-menu/custom-context-menu-6.component';
import { ObjectManagement1Component } from './examples/object-management/object-management-1.component';
import { ObjectManagement2Component } from './examples/object-management/object-management-2.component';
import { ObjectManagement3Component } from './examples/object-management/object-management-3.component';
import { ObjectManagement4Component } from './examples/object-management/object-management-4.component';
import { ObjectManagement5Component } from './examples/object-management/object-management-5.component';
import { ObjectManagement6Component } from './examples/object-management/object-management-6.component';
import { Collaboration1Component } from './examples/collaboration/collaboration-1.component';
import { Theming1Component } from './examples/theming/theming-1.component';
import { Theming2Component } from './examples/theming/theming-2.component';
import { Theming3Component } from './examples/theming/theming-3.component';
import { Theming4Component } from './examples/theming/theming-4.component';
import { Theming5Component } from './examples/theming/theming-5.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'e2e/editor' },
  {
    path: 'e2e',
    children: [
      { path: 'editor', component: EditorPageComponent },
      { path: 'multi-editor', component: MultiEditorPageComponent },
    ],
  },
  {
    path: 'examples',
    children: [
      { path: 'custom-toolbar-annotation', component: CustomToolbarAnnotationComponent },
      { path: 'custom-toolbar-diagramming', component: CustomToolbarDiagrammingComponent },
      { path: 'custom-toolbar-full-drawing-app', component: CustomToolbarFullDrawingAppComponent },
      { path: 'custom-toolbar-external', component: CustomToolbarExternalComponent },
      { path: 'custom-context-menu-1', component: CustomContextMenu1Component },
      { path: 'custom-context-menu-2', component: CustomContextMenu2Component },
      { path: 'custom-context-menu-3', component: CustomContextMenu3Component },
      { path: 'custom-context-menu-4', component: CustomContextMenu4Component },
      { path: 'custom-context-menu-5', component: CustomContextMenu5Component },
      { path: 'custom-context-menu-6', component: CustomContextMenu6Component },
      { path: 'object-management-1', component: ObjectManagement1Component },
      { path: 'object-management-2', component: ObjectManagement2Component },
      { path: 'object-management-3', component: ObjectManagement3Component },
      { path: 'object-management-4', component: ObjectManagement4Component },
      { path: 'object-management-5', component: ObjectManagement5Component },
      { path: 'object-management-6', component: ObjectManagement6Component },
      { path: 'theming-1', component: Theming1Component },
      { path: 'theming-2', component: Theming2Component },
      { path: 'theming-3', component: Theming3Component },
      { path: 'theming-4', component: Theming4Component },
      { path: 'theming-5', component: Theming5Component },
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
