---
name: lib-builder
description: "Add features, fix bugs, or edit existing code in the kritzel-stencil core library. Covers tools, handlers, objects, components, themes, helpers, providers, and managers. Use when working inside libs/kritzel-stencil/src/."
argument-hint: "Describe the feature, bug fix, or change to make in the stencil core"
---

# Lib Builder — kritzel-stencil Core Library

## When to Use

- Adding or editing a tool, handler, manager, object, component, provider, or helper in `libs/kritzel-stencil/src/`
- Fixing a bug in the core rendering engine or state management
- Adding or modifying CSS variables / theming
- Integrating a new sync or asset provider
- Extending or wiring the localization system (`KritzelLocalizationManager`, `engine.t()`, resolved UI term props)

## Architecture Overview

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Core | `classes/core/` | Orchestration, state (`KritzelStore`), viewport, workspace management |
| Tools | `classes/tools/` | User interaction instruments (brush, eraser, shape, etc.) |
| Handlers | `classes/handlers/` | Event handling (keyboard, hover, context-menu, resize, move) |
| Objects | `classes/objects/` | Drawable canvas entities (path, shape, text, image, group) |
| Managers | `classes/managers/` | Cross-cutting concerns (theme, cursor, anchor) |
| Providers | `classes/providers/` | External integrations (sync backends, asset storage) |
| Registries | `classes/registries/` | Lookup tables (tool registry, icon registry) |
| Structures | `classes/structures/` | Algorithms & data (quadtree, object map, app state map) |
| Components | `components/` | Stencil Web Components (editor, engine, UI controls) |
| Helpers | `helpers/` | Pure static utilities (geometry, color, theme, alignment) |
| Themes | `themes/` | Built-in theme presets (light, dark) |
| Interfaces | `interfaces/` | TypeScript contracts |
| Constants | `constants/` | Shared constant values |
| Events | `events/` | Event type definitions |

## Dependency Injection

All major classes receive `KritzelCore` via constructor. Core is the service locator:

```typescript
protected readonly _core: KritzelCore;
constructor(core: KritzelCore) { this._core = core; }
```

Access through core: `this._core.store`, `this._core.engine`, `this._core.toolRegistry`, `this._core.themeManager`, `this._core.viewport`.

## File Naming Conventions

| Suffix | Purpose | Example |
|--------|---------|---------|
| `*.class.ts` | Classes | `brush-tool.class.ts` |
| `*.interface.ts` | Type contracts | `tool.interface.ts` |
| `*.helper.ts` | Static utilities | `theme.helper.ts` |
| `*.manager.ts` | Manager classes | `theme.manager.ts` |
| `*.handler.ts` | Event handlers | `key.handler.ts` |
| `*.registry.ts` | Registry/lookup | `tool.registry.ts` |
| `*.structure.ts` | Data structures | `quadtree.structure.ts` |
| `*.config.ts` | Configuration | `default-brush-tool.config.ts` |
| `*.event.ts` | Event definitions | `login.event.ts` |
| `*.enum.ts` | Enumerations | `alignment.enum.ts` |
| `*.spec.ts` | Jest tests | `brush-tool.class.spec.ts` |

## Patterns

Select the relevant pattern based on what you're working on:

| Pattern | When to Load |
|---------|-------------|
| [core.md](patterns/core.md) | Adding or editing methods on KritzelCore |
| [tool.md](patterns/tool.md) | Adding or editing a drawing tool |
| [handler.md](patterns/handler.md) | Adding or editing an event handler |
| [object.md](patterns/object.md) | Adding or editing a canvas object type |
| [component.md](patterns/component.md) | Adding or editing a Stencil web component |
| [localization.md](patterns/localization.md) | Adding or editing translated UI terms, locale files, or localization-aware component wiring |
| [theme.md](patterns/theme.md) | Adding CSS variables or modifying theme integration |
| [helper.md](patterns/helper.md) | Adding or editing a static utility helper |
| [provider.md](patterns/provider.md) | Adding or editing a sync/asset provider |
| [manager.md](patterns/manager.md) | Adding or editing a cross-cutting manager |
| [dynamic-objects.md](patterns/dynamic-objects.md) | Maintaining dynamic object rendering, renderer lifecycle, wheel behavior, and wrapper integration |
| [unit-tests.md](patterns/unit-tests.md) | Adding/updating Jest specs, fixing flaky tests, or adapting tests after refactors |
| [reactivity-and-wrappers.md](patterns/reactivity-and-wrappers.md) | Debugging or preventing prop timing bugs between Stencil core and Angular/React/Vue wrappers |

**Load the relevant pattern file(s) before making changes.**

## Public Exports

To expose a class, function, interface, or constant publicly, it must be exported in **four** places:

1. **`libs/kritzel-stencil/src/index.ts`** — the stencil core barrel file
2. **`libs/kritzel-angular/projects/lib/src/public-api.ts`** — re-exports from `kritzel-stencil`
3. **`libs/kritzel-react/lib/index.ts`** — re-exports from `kritzel-stencil`
4. **`libs/kritzel-vue/lib/index.ts`** — re-exports from `kritzel-stencil`

All three framework wrappers explicitly re-export symbols from `kritzel-stencil` so that consuming applications (e.g. the demos) only need a single import source — `kritzel-angular`, `kritzel-react`, or `kritzel-vue` — without ever importing `kritzel-stencil` directly.

**Keep the export lists consistent across all three wrappers.** When adding a new public symbol, add it to all four files.

Example (adding `KritzelFoo`):

```typescript
// libs/kritzel-stencil/src/index.ts
export * from './classes/objects/foo.class';

// libs/kritzel-angular/projects/lib/src/public-api.ts
// libs/kritzel-react/lib/index.ts
// libs/kritzel-vue/lib/index.ts
export {
    // ... existing exports ...
    KritzelFoo,
} from 'kritzel-stencil';
```

## General Rules

1. **No framework code** — kritzel-stencil is framework-agnostic; never import Angular/React/Vue
2. **Serialization** — objects that persist must implement `serialize()` / `deserialize()` and set `__class__`
3. **State changes** — go through `KritzelStore`; never mutate state directly
4. **CSS variables** — prefix all with `--kritzel-`; run `node scripts/generate-theme-interface.js` after adding new ones
5. **Strict typing** — avoid `any`; use `unknown` at boundaries
6. **Test coverage** — add/update `*.spec.ts` for logic changes
7. **Theme contract + tests move together** — when CSS variables are added/removed/renamed, regenerate `interfaces/theme.interface.ts`, update `themes/light-theme.ts` and `themes/dark-theme.ts` with matching keys, and adjust related unit tests (for example theme variable-count assertions)
8. **No one-time prop snapshots for runtime collaborators** — if a component creates long-lived helpers/handlers/managers from `@Prop()` values, keep those collaborators synchronized with `@Watch()` handlers
9. **Design for late-bound wrapper inputs** — Angular/React/Vue wrappers may apply prop updates after `componentDidLoad`; component behavior must still reflect latest props
10. **Test post-initialization updates** — add at least one unit test that updates props after initialization and asserts the runtime collaborator receives new values
11. **Prefer reusable bug lessons over local patches** — when fixing a lifecycle/prop bug, update the relevant pattern docs so future changes avoid the same class of regression
12. **Treat sync persistence as opt-in by default** — `kritzel-editor` defaults to `syncConfig.providers = []`, so object state is not persisted across page reloads and not persisted when switching workspaces unless a sync provider is explicitly configured
13. **Choose providers by persistence scope** — use `IndexedDBSyncProvider` for persistent local storage across reloads (and across workspaces), and use `InMemorySyncProvider` when cross-workspace persistence is needed only within the current runtime session
14. **Keep demos deterministic unless persistence is the concept** — most demos should keep no sync provider so reload resets canvas state; workspace concept demos are the main exception and should use `InMemorySyncProvider`
15. **Dynamic object renderers must be lifecycle-safe** — always provide mount/unmount symmetry and return normalized renderer state from unmount when state persistence is expected
16. **Wheel behavior must preserve canvas navigation** — dynamic objects should consume wheel only when they can actually scroll in the current direction; otherwise wheel must pass through to viewport interactions

## Unit Tests

Unit-test guidance is documented in [patterns/unit-tests.md](patterns/unit-tests.md).

## Cross-Wrapper Reliability Checklist

Before merging changes in `components/core/`:

- Identify all constructor-time snapshots of `@Prop()` data copied into helper classes
- Add/verify `@Watch()` synchronization for props consumed by long-lived runtime instances
- Confirm default prop values do not silently override late-bound wrapper values
- Add or update tests for both initial props and late prop updates
