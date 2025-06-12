import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { LibModule } from 'kritzel-angular'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    importProvidersFrom(LibModule)
  ]
};
