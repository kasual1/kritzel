# @updraw/core

The framework-agnostic core of [Updraw](https://updraw.io/): objects, tools, sync and asset providers, themes, locales and helpers.

You don't install this package yourself. `@updraw/engine` and `@updraw/editor` depend on it, and `@updraw/engine` and the Angular, React and Vue wrappers re-export its API, so keep importing from those packages.

## Why a separate package

`@updraw/engine` and `@updraw/editor` are Stencil component libraries. Each Stencil output bundles the code its components import. Keeping the classes in this plain package, which both libraries load as an external dependency, means an app always has exactly one copy of every Updraw class, so `instanceof` checks and shared static state work across the engine and the editor.

## Script tags and import maps

Like `yjs`, `@updraw/core` is imported by bare specifier from the engine and editor builds. When loading those builds directly in the browser without a bundler, add `@updraw/core` to your import map next to `yjs`.
