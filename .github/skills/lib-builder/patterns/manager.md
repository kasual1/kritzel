# Manager Pattern

## Location

`libs/core/src/classes/managers/`

## Purpose

Managers handle cross-cutting concerns that span multiple components or tools. They are singleton-per-editor instances owned by `KritzelCore`.

## Existing Managers

| Manager | Responsibility |
|---------|---------------|
| `KritzelThemeManager` | Theme registry, CSS variable application, theme switching |
| `KritzelCursorManager` | Cursor style changes based on state/tool |
| `KritzelAnchorManager` | Anchor point management for transforms |
| `KritzelLocalizationManager` | Locale registration, term resolution, interpolation, and fallback selection |

## Structure

```typescript
import { KritzelCore } from '../core/core.class';

export class MyManager {
  private readonly _core: KritzelCore;

  constructor(core: KritzelCore) {
    this._core = core;
    // initialization
  }

  /** Public API */
  doSomething(): void {
    // access state via this._core.store
  }

  /** Cleanup */
  destroy(): void {
    // release resources, remove listeners
  }
}
```

## Lifecycle

1. Instantiated by `KritzelCore` during initialization
2. Available via `core.<managerName>` (e.g., `core.themeManager`)
3. Active for the lifetime of the editor
4. `destroy()` called when editor is torn down

## Conventions

- File name: `<domain>.manager.ts`
- Class name: `Kritzel<Domain>Manager`
- One manager per cross-cutting concern
- Receives `KritzelCore` via constructor
- May hold private state, but shared state goes through `KritzelStore`
- Must provide a `destroy()` method for cleanup
- Should not directly manipulate DOM — delegate to helpers or the engine
- Localization managers should keep fallback resolution deterministic and expose bulk resolution helpers only when the editor or UI layer needs many terms at once

## Unit Testing Guidance

- Mock manager dependencies via their public core-facing APIs (e.g., `core.toolRegistry`, `core.store.setState`, `core.engine.emit...`)
- Provide behavior-complete object doubles for manager pipelines (methods + fields that manager logic invokes)
- For strategy/registry managers, test: registration order, `canHandle` routing, first-match execution, fallback behavior
- Keep manager specs independent from core internals; core specs should validate delegation to the manager

## When to Use a Manager vs. Other Patterns

| Use a Manager when... | Use something else when... |
|----------------------|---------------------------|
| Logic spans multiple tools/handlers | Logic is specific to one tool → put in the tool |
| Needs lifecycle (init, destroy) | Stateless computation → use a helper |
| Needs to observe store changes | One-shot operation → inline in handler |
| Is a singleton service per editor | Multiple instances needed → use a class/structure |
