import { Routes } from '@angular/router';
import { EditorPageComponent } from './e2e/editor-page.component';
import { EditorHocuspocusPageComponent } from './e2e/editor-hocuspocus-page.component';
import { MultiEditorPageComponent } from './e2e/multi-editor-page.component';
import { WrappedEditorPageComponent } from './e2e/wrapped-editor-page.component';

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
  { path: '**', redirectTo: 'e2e/editor' },
];
