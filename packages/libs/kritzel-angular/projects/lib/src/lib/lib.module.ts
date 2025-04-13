import { APP_INITIALIZER, NgModule } from '@angular/core';
import { defineCustomElements } from 'kritzel-stencil/loader';

@NgModule({
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => defineCustomElements,
      multi: true,
    },
  ],
})
export class LibModule {}
