import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideKritzel } from 'kritzel-angular';
 
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideKritzel(),
  ]
};
