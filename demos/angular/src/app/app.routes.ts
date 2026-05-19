import { Routes } from '@angular/router';
import { EditorPageComponent } from './editor-page.component';
import { MultiEditorPageComponent } from './multi-editor-page.component';
import { userResolver } from './user.resolver';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: EditorPageComponent, resolve: { user: userResolver } },
  { path: 'multi-editor', component: MultiEditorPageComponent },
  { path: ':workspaceId', component: EditorPageComponent, resolve: { user: userResolver } },
  { path: '**', redirectTo: '' },
];
