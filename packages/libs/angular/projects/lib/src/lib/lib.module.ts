import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { DIRECTIVES } from '.';
import { defineCustomElements } from 'kritzel-stencil/loader';

export function initializeApp(): () => Promise<void> {
  return async () => defineCustomElements(window);
}

@NgModule({
  declarations: [
    ...DIRECTIVES
  ],
  exports: [
    ...DIRECTIVES
  ],
})
export class LibModule {

  static forRoot(): ModuleWithProviders<LibModule> {

    return {
      ngModule: LibModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: initializeApp,
          multi: true
        }
      ]
    };
  }
}
