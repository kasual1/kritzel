import { Routes, UrlMatcher } from '@angular/router';
import { EditorPageComponent } from './editor-page.component';

const editorRouteMatcher: UrlMatcher = (segments) => {
  if (segments.length === 0) {
    return { consumed: [] };
  }

  if (segments.length === 1) {
    return {
      consumed: segments,
      posParams: { workspaceId: segments[0] },
    };
  }

  return null;
};

export const routes: Routes = [
  { matcher: editorRouteMatcher, component: EditorPageComponent },
  { path: '**', redirectTo: '' },
];
