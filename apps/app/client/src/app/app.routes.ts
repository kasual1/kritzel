import { Routes } from '@angular/router';
import { userResolver } from './resolvers/user.resolver';
import { Editor } from './components/editor';

export const routes: Routes = [
   { path: '', pathMatch: 'full', component: Editor, resolve: { user: userResolver } },
  { path: ':workspaceId', component: Editor, resolve: { user: userResolver } },
  { path: '**', redirectTo: '' },
];
