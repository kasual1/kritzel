import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { migrateLegacyStorageKeys } from './app/legacy-storage';
import { registerServiceWorkerWithRetry } from './service-worker-registration';
import { preventSwipeNavigation } from './swipe-navigation';

preventSwipeNavigation();
// Before bootstrap, so the user resolver, the config service and the editor see the carried-over keys.
migrateLegacyStorageKeys();

if (!isDevMode()) {
  registerServiceWorkerWithRetry();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
