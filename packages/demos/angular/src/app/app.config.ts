import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideYourLibraryFeatures } from 'kritzel-angular'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideYourLibraryFeatures(),
  ]
};
