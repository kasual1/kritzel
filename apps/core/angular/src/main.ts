import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType } from '@upmade/angular-editor';

// Expose Upmade classes on window for Playwright e2e tests
(window as any).__upmade__ = { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType };

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
