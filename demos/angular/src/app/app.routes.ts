import { Routes } from '@angular/router';
import { CustomToolbar1Component } from './examples/custom-toolbar-1.component';
import { userResolver } from './resolvers/user.resolver';
import { CustomToolbar2Component } from './examples/custom-toolbar-2.component';
import { EditorPageComponent } from './e2e/editor-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { Collaboration1Component } from './examples/collaboration-1.component';

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
