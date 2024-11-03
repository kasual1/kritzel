import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { defineCustomElements } from '@workspace/stencil/loader';


export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => defineCustomElements,
      multi: true
    },
  ]
};
