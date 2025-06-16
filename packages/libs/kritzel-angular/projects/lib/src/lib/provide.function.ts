// your-library/src/index.ts (or a dedicated providers file)
import { provideAppInitializer, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { defineCustomElements } from 'kritzel-stencil/loader';


/**
 * Provides the necessary initializers for YourLibrary, including defining custom elements.
 */
export function provideYourLibraryFeatures(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      // You can use `inject` here if your initializer needs other services
      // const someService = inject(SomeLibraryService);
      return defineCustomElements(); // Or return a Promise if defineCustomElements is async
    }),
    // ... other standalone providers for your library's services, interceptors, etc.
  ]);
}