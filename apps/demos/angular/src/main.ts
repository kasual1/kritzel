import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, ShapeType } from '@updraw/angular-editor';

// Expose Updraw classes on window for Playwright e2e tests
(window as any).__updraw__ = { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, ShapeType };

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
