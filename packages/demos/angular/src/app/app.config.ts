import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { LibModule } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(LibModule.forRoot())
  ]
};
