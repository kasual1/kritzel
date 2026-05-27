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
| [theme.md](patterns/theme.md) | Adding CSS variables or modifying theme integration |
| [helper.md](patterns/helper.md) | Adding or editing a static utility helper |
| [provider.md](patterns/provider.md) | Adding or editing a sync/asset provider |
| [manager.md](patterns/manager.md) | Adding or editing a cross-cutting manager |

**Load the relevant pattern file(s) before making changes.**

## General Rules

1. **No framework code** — kritzel-stencil is framework-agnostic; never import Angular/React/Vue
2. **Serialization** — objects that persist must implement `serialize()` / `deserialize()` and set `__class__`
3. **State changes** — go through `KritzelStore`; never mutate state directly
4. **CSS variables** — prefix all with `--kritzel-`; run `node scripts/generate-theme-interface.js` after adding new ones
5. **Strict typing** — avoid `any`; use `unknown` at boundaries
6. **Test coverage** — add/update `*.spec.ts` for logic changes
