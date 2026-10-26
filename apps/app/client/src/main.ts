import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { registerServiceWorkerWithRetry } from './service-worker-registration';
import { preventSwipeNavigation } from './swipe-navigation';

preventSwipeNavigation();

if (!isDevMode()) {
  registerServiceWorkerWithRetry();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
