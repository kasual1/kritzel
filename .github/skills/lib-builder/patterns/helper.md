# Helper Pattern

## Location

`libs/engine/core/src/helpers/`

## Structure

Helpers are static utility classes — no instance state, no constructor, no dependency on `KritzelCore`.

```typescript
export class MyHelper {
  /**
   * Describe what this method does.
   */
  static computeSomething(input: SomeType): ResultType {
    // pure computation
  }
}
```

## Existing Helpers

| Helper | Domain |
|--------|--------|
| `GeometryHelper` | Collision, distance, bounding boxes, rotation math |
| `AlignmentHelper` | Object alignment (left, center, distribute) |
| `ThemeHelper` | Flatten theme → CSS variables, apply to element |
| `ColorHelper` | Color parsing, hex/rgba conversion, theme color resolution |
| `ObjectHelper` | UUID generation, object utilities |
| `KeyboardHelper` | Key detection, modifier keys |
| `HtmlHelper` | DOM utilities |
| `ClassHelper` | `isInstanceOf` runtime type checks using `__class__` |
| `EventHelper` | Event creation and dispatch utilities |

## Conventions

- File name: `<domain>.helper.ts`
- Class name: `<Domain>Helper` (or `Kritzel<Domain>Helper` for namespacing)
- All methods are `static`
- No side effects — pure functions only
- No dependency on `KritzelCore` or store
- Helpers are imported directly where needed; they are not injected

## When to Create a Helper vs. Inline Logic

Create a helper when:
- The logic is reused across 2+ files
- The computation is complex enough to warrant unit testing
- It's a pure transformation with no side effects

Keep logic inline when:
- It's a one-liner specific to one call site
- It depends on instance state

## Unit Testing Guidance

- Keep helper tests deterministic and environment-agnostic; avoid hidden coupling to browser-only APIs
- For browser payload helpers (clipboard, events), use structural mocks rather than concrete DOM constructor behavior
- Validate priority/order rules explicitly when helper output drives strategy selection
