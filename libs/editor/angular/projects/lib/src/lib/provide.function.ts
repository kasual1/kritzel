import {
  provideAppInitializer,
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { defineCustomElements } from '@upmade/engine/loader';

export function provideUpmade(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      console.info('Initializing Upmade custom elements');
      return defineCustomElements(window);
    }),
  ]);
}
