import {
  provideAppInitializer,
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { defineCustomElements } from '@kritzel/engine/loader';

export function provideKritzel(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      console.info('Initializing Kritzel custom elements');
      return defineCustomElements(window);
    }),
  ]);
}
