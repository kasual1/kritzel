# @kritzel/core

The framework-agnostic core of [Kritzel](https://kritzel.io/): objects, tools, sync and asset providers, themes, locales and helpers.

You don't install this package yourself. `@kritzel/engine` and `@kritzel/editor` depend on it, and `@kritzel/engine` and the Angular, React and Vue wrappers re-export its API, so keep importing from those packages.

## Why a separate package

`@kritzel/engine` and `@kritzel/editor` are Stencil component libraries. Each Stencil output bundles the code its components import. Keeping the classes in this plain package, which both libraries load as an external dependency, means an app always has exactly one copy of every Kritzel class, so `instanceof` checks and shared static state work across the engine and the editor.

## Script tags and import maps

Like `yjs`, `@kritzel/core` is imported by bare specifier from the engine and editor builds. When loading those builds directly in the browser without a bundler, add `@kritzel/core` to your import map next to `yjs`.
