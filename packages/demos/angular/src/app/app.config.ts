import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { LibModule } from 'lib';


export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(LibModule.forRoot())
  ]
};
