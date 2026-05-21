import { Routes } from '@angular/router';
import { EditorPageComponent } from './editor-page.component';
import { MultiEditorPageComponent } from './multi-editor-page.component';
import { CustomToolbar1Component } from './examples/custom-toolbar-1.component';
import { CustomToolbar2Component } from './examples/custom-toolbar-2.component';
import { userResolver } from './user.resolver';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'e2e', },
  {
    path: 'e2e',
    children: [
      { path: '', pathMatch: 'full', component: EditorPageComponent, resolve: { user: userResolver } },
      { path: 'multi-editor', component: MultiEditorPageComponent },
      { path: ':workspaceId', component: EditorPageComponent, resolve: { user: userResolver } },
    ],
  },
  {
    path: 'examples',
    children: [
      { path: 'custom-toolbar-1', component: CustomToolbar1Component },
      { path: 'custom-toolbar-2', component: CustomToolbar2Component },
    ],
  },
  { path: '**', redirectTo: 'e2e' },
];
