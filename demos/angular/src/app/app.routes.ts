import { Routes } from '@angular/router';
import { EditorPageComponent } from './editor-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: EditorPageComponent },
  { path: ':workspaceId', component: EditorPageComponent },
  { path: '**', redirectTo: '' },
];
