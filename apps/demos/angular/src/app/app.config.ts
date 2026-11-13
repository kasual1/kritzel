import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideUpdraw } from '@updraw/angular-editor';
import { routes } from './app.routes';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withHashLocation()),
    provideUpdraw(),
  ]
};
