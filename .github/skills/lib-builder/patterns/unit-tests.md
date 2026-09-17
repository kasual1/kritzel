# Unit Tests Pattern

## Location

`libs/engine/core/src/**/*.spec.ts`

## Purpose

Provide reliable, maintainable Jest tests for core library logic while staying resilient to jsdom/browser API differences and architectural refactors.

## How to Run Tests

- In this repository, do not rely on targeted single-file spec runs for `@kritzel/engine` (for example passing specific `*.spec.ts` paths).
- Run tests from the repository root using `npm run test`.
- Treat root-level `npm run test` as the authoritative verification path.

## Reliability Rules

1. **Mock public contracts, not private fields**
- Mock the same APIs production code uses (e.g., `core.toolRegistry`), not private internals (e.g., `_toolRegistry`).

2. **Use behavior-complete test doubles**
- If production logic calls methods on objects (e.g., `centerInViewport()`, `updatePosition()`), test doubles must provide those methods.

3. **Prefer structural browser payload mocks**
- For clipboard/drag-drop tests, use minimal structural payloads like `{ items, files, getData }` instead of relying on mutable `DataTransfer` constructor behavior in jsdom.

4. **Keep orchestrator tests delegation-focused**
- When logic is extracted from `KritzelCore` into managers, core tests should verify forwarding/delegation.
- Behavioral correctness should be asserted in manager/tool/helper specs.

5. **Regenerate generated types after API changes**
- After changing Stencil `@Prop()` or `@Method()`, run the stencil build so `components.d.ts` is regenerated before running tests.

6. **Guard optional runtime APIs and test fallbacks**
- Clipboard API, canvas/image export, and similar browser features must have graceful fallback paths.
- Add tests for both the supported path and fallback path.

7. **Mock heavy DOM/editor dependencies at boundaries**
- Avoid deep jsdom coupling for ProseMirror/canvas internals.
- Stub object creation or integration seams in unit tests.

8. **Prefer outcome assertions over implementation-order assertions**
- Only assert call ordering when sequencing is behaviorally significant.
- Otherwise prefer assertions on state changes and emitted events.

9. **Keep theming tests aligned with CSS variable changes**
- When adding/removing/renaming `--kritzel-*` variables, regenerate `interfaces/theme.interface.ts` and update `themes/light-theme.ts` and `themes/dark-theme.ts` first.
- Then adjust related tests that assert flattened variable totals or generated theme keys (for example `helpers/theme.helper.spec.ts`).

## Refactor-Resilient Test Checklist

- Update tests that reference moved logic (core -> manager/tool/etc.)
- Ensure mocks match current public API shape after refactors
- Add at least one test for fallback behavior when browser API is unavailable
- Keep fixtures minimal and explicit; avoid hidden global setup dependencies

## Common Pitfalls

- Mocking private fields that are no longer used by implementation
- Returning plain `{}` objects where methods are expected
- Depending on browser constructor quirks unsupported by jsdom
- Forgetting to regenerate `components.d.ts` after Stencil API updates
