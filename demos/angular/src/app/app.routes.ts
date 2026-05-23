import { Routes } from '@angular/router';
import { CustomToolbar1Component } from './examples/custom-toolbar-1.component';
import { userResolver } from './resolvers/user.resolver';
import { CustomToolbar2Component } from './examples/custom-toolbar-2.component';
import { CustomToolbar3Component } from './examples/custom-toolbar-3.component';
import { CustomToolbar4Component } from './examples/custom-toolbar-4.component';
import { CustomToolbar5Component } from './examples/custom-toolbar-5.component';
import { CustomToolbar6Component } from './examples/custom-toolbar-6.component';
import { CustomToolbar7Component } from './examples/custom-toolbar-7.component';
import { EditorPageComponent } from './e2e/editor-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { Collaboration1Component } from './examples/collaboration-1.component';
import { CustomContextMenu1Component } from './examples/custom-context-menu-1.component';
import { CustomContextMenu2Component } from './examples/custom-context-menu-2.component';
import { CustomContextMenu3Component } from './examples/custom-context-menu-3.component';
import { CustomContextMenu4Component } from './examples/custom-context-menu-4.component';
import { CustomContextMenu5Component } from './examples/custom-context-menu-5.component';
import { CustomContextMenu6Component } from './examples/custom-context-menu-6.component';

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
      { path: 'custom-toolbar-1', component: CustomToolbar1Component },
      { path: 'custom-toolbar-2', component: CustomToolbar2Component },
      { path: 'custom-toolbar-3', component: CustomToolbar3Component },
      { path: 'custom-toolbar-4', component: CustomToolbar4Component },
      { path: 'custom-toolbar-5', component: CustomToolbar5Component },
      { path: 'custom-toolbar-6', component: CustomToolbar6Component },
      { path: 'custom-toolbar-7', component: CustomToolbar7Component },
      { path: 'custom-context-menu-1', component: CustomContextMenu1Component },
      { path: 'custom-context-menu-2', component: CustomContextMenu2Component },
      { path: 'custom-context-menu-3', component: CustomContextMenu3Component },
      { path: 'custom-context-menu-4', component: CustomContextMenu4Component },
      { path: 'custom-context-menu-5', component: CustomContextMenu5Component },
      { path: 'custom-context-menu-6', component: CustomContextMenu6Component },
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
