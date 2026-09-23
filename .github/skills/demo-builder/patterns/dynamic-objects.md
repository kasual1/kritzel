# Pattern: Dynamic Objects (Cross-Framework)

## Purpose

Use this pattern when a demo page creates or mounts `KritzelDynamicObject` objects.

Applies to Angular, React, and Vue demos equally.

## Core Architecture

Split responsibilities into three layers:

1. Page orchestration
- Register/unregister renderers in page lifecycle hooks.
- Seed initial objects only in a guarded `onReady` flow.

2. Renderer module
- Hold renderer registration, state normalization, mount, unmount, and cleanup.
- Keep renderer-specific DOM/UI logic out of the page file.

3. Object factory
- Create configured `KritzelDynamicObject` instances in dedicated functions.
- Return object instances that are ready to add via editor APIs.

## Renderer Key Rules

1. Use stable, namespaced keys (for example `<page>-<feature>`).
2. Treat keys as persistence contracts; avoid renaming unless migration is intentional.
3. Keep each key unique per renderer behavior.

## Mount and Unmount Rules

1. Keep a map keyed by `object.id` for mounted renderer instances.
2. On mount, replace any stale instance for the same object id before attaching new UI.
3. On unmount, return a serializable state snapshot for persistence.
4. Always clear container content on unmount.
5. Always unregister renderers during page cleanup.

## State Rules

1. Normalize unknown `rendererData` defensively before use.
2. Provide explicit initial-state factories.
3. Clone mutable state on reads/writes to avoid accidental shared mutation.
4. Persist only JSON-serializable data.

## Resource Cleanup Rules

1. Track and remove all event listeners.
2. Disconnect observers (`ResizeObserver`, etc.) on destroy.
3. Remove mounted roots/elements in cleanup paths.
4. Avoid leaking timers, animation handles, or global DOM nodes.

## Object Creation Rules

1. Create objects via dedicated factory helpers, not inline page code.
2. Use temporary placeholder elements while renderer mounts.
3. Set `rendererKey` and `rendererData` explicitly.
4. Set deterministic `translateX`, `translateY`, `width`, and `height`.
5. Set object capabilities intentionally (`isRotatable`, etc.).

## Seeding Rules

1. Seed only once with an idempotency guard.
2. Seed only when the workspace is empty (or when scenario explicitly requires additional objects).
3. Add objects sequentially when order/overlap matters.
4. Keep seed logic short in the page; delegate object details to factories.

## Container and Interaction Rules

1. Configure container styles intentionally in `onMount` (for example `overflow: visible` when shadows/overlays are needed).
2. Keep DOM interactions scoped to mounted roots.
3. Make keyboard/pointer behavior explicit and deterministic.

## Cross-Framework Equivalence Rules

1. Preserve behavior parity when porting renderer-based demos.
2. Keep state shape and persistence semantics equivalent.
3. Keep seed positions/sizes comparable unless framework-specific constraints require divergence.
4. Verify route and docs references after refactors that move dynamic object modules.
