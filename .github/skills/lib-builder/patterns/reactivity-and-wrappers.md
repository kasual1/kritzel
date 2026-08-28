# Reactivity and Wrappers Pattern

## Problem Class

This pattern addresses bugs where Stencil core components receive correct wrapper inputs (Angular/React/Vue), but runtime behavior still uses defaults or stale values.

Typical cause:
- A long-lived runtime collaborator (handler, manager, viewport helper) captures `@Prop()` values once during initialization
- Wrapper applies or updates props later
- Collaborator is never synchronized with new values

## Detection Heuristics

Check for all of the following:
- `new SomeRuntimeClass(this.someProp, ...)` in `componentDidLoad` or constructor
- No `@Watch('someProp')` updating that runtime instance
- Wrapper demo passes a custom input, but behavior matches component default values

## Required Fix Shape

1. Keep initial constructor wiring so first render works
2. Add `@Watch()` bridge for each prop consumed by long-lived runtime instances
3. In each watcher, guard for uninitialized runtime objects
4. Fallback safely when new values are undefined (`?? []`, `?? default`)
5. Add regression tests for late prop updates

## Test Matrix

For each affected prop:
- Initial value at mount is honored
- Value updated after runtime instance creation is honored
- Undefined/null-like updates resolve to safe fallback behavior

## Cross-Wrapper Scope

Always treat this as cross-framework behavior, not framework-specific behavior:
- Angular can bind after custom element creation
- React can rerender with new object references
- Vue can update prop references reactively

If the bug appears in one wrapper demo, validate the core fix in Stencil and avoid wrapper-only workarounds.

## Dynamic Object Runtime Note

For dynamic object renderers, wrapper abstractions may legitimately handle framework-specific runtime behavior (for example style encapsulation and mount strategy), but they must not change the core lifecycle contract:
- Register renderer before object mount paths execute
- Keep mount/unmount cleanup symmetric
- Persist latest normalized state on unmount when renderer state is user-editable
- Preserve wheel pass-through semantics so non-scrollable custom content does not block viewport navigation

## Review Checklist

- No stale snapshots of reactive props in long-lived runtime instances
- Watchers exist for all externally configurable runtime behavior
- Unit tests cover post-initialization updates
- Defaults do not override newer wrapper inputs
