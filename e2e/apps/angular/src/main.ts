import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelCustomElement, ShapeType } from 'kritzel-angular';

// Expose Kritzel classes on window for Playwright e2e tests
(window as any).__kritzel__ = { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelCustomElement, ShapeType };

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
