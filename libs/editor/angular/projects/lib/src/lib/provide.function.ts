import {
  provideAppInitializer,
  EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { defineCustomElements } from '@updraw/engine/loader';

export function provideUpdraw(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      console.info('Initializing Updraw custom elements');
      return defineCustomElements(window);
    }),
  ]);
}
