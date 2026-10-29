# Dynamic Objects Pattern

## Scope

Use this pattern when maintaining dynamic object behavior across core and wrappers.

Primary touchpoints:
- `libs/core/src/classes/objects/dynamic-object.class.ts`
- `libs/engine/core/src/components/core/kritzel-engine/kritzel-engine.tsx`
- `libs/core/src/helpers/wheel.helper.ts`
- `libs/core/src/classes/registries/dynamic-object-renderer.registry.ts`
- Wrapper helpers such as `libs/editor/vue/lib/vue-dynamic-object-renderer.ts`

## Maintainer Mental Model

A Kritzel dynamic object is a persisted canvas object whose visual content is mounted into an engine-managed container.

Supported hosting modes:
- Pure HTML hosting: object mounts its `element` directly (no renderer required).
- Registry-driven hosting: object uses `rendererKey` to resolve a registered renderer that can mount framework-specific components/content (Angular, React, Vue, or other runtimes).

Flow:
1. Object stores `rendererKey` + optional `rendererData`
2. Engine resolves renderer via `KritzelDynamicObjectRendererRegistry`
3. Renderer mounts framework/runtime content into the object container
4. Renderer serialization/unmount returns latest serializable state for persistence

## Renderer Contract

A renderer should implement symmetric lifecycle behavior:
- `onMount(context)` creates or attaches runtime content
- `onSerialize(context)` returns latest serializable state when copy/export happens while mounted
- `onUnmount(context)` cleans up and returns latest normalized state when needed

Rules:
- Never leak subscriptions, observers, or framework roots after unmount
- Treat `context.data` as untrusted input and normalize shape defensively
- Keep returned state serializable and stable across sessions
- Avoid mutating shared global state from renderer hooks

## Clipboard Serialization

Copy/paste serializes objects without unmounting them first. Stateful dynamic content that must
survive clipboard copy should therefore implement `onSerialize(context)` and return the live
state from the mounted runtime. `onUnmount(context)` remains the cleanup-time persistence path.

Raw DOM fallback stores `element.outerHTML` only. That preserves visible markup, but it cannot
preserve event listeners, closures, framework instances, timers, or subscriptions. Use a stable
`rendererKey` plus serializable `rendererData` for behavior that must be recreated after paste.

## Registry Discipline

Use stable keys (`rendererKey`) and register once per runtime boot path.

Rules:
- Register before first object mount
- Unregister when host page/module is disposed
- Do not register duplicate keys without explicit replacement strategy
- Keep key naming explicit and framework-agnostic (`todo-list`, not page-local random keys)

## Wheel and Scroll Ownership

Wheel handling must not trap canvas navigation.

Expected behavior:
- If mounted dynamic object content can scroll in the wheel direction, keep wheel in the dynamic object
- If content cannot scroll (no overflow or at boundary), pass wheel back to editor/viewport

Do:
- Keep this decision in shared helper logic (`wheel.helper.ts`)
- Cover both positive and negative paths with unit tests
- Validate integration with engine-level tests where viewport callbacks are involved

## Wrapper Integration Strategy

Wrappers should expose ergonomic APIs, but core behavior remains authoritative.

Guidelines:
- Wrapper helpers can adapt framework runtime details (for example Vue custom elements for style encapsulation)
- Wrapper helpers must still honor renderer lifecycle and state persistence contract
- Prefer wrapper-level abstractions over ad-hoc demo-only hacks
- Keep wrapper exports explicit so demos can import from wrapper package only

## Styling in Shadowed Hosts

When rendering framework content into engine-managed containers, styling may fail if framework styles are injected only at document scope.

Maintainer guidance:
- Prefer encapsulated rendering strategies when available (for example Vue `defineCustomElement`)
- Avoid page-specific style patches that bypass renderer abstraction
- Document any framework-specific constraints in wrapper docs/helpers, not in core object logic

## Testing Matrix

Minimum coverage for dynamic object changes:
- Unit: helper decisions (wheel/scroll, normalization)
- Unit: engine behavior around mount/unmount and state handoff
- E2E: create/update/remove dynamic object and rendererData persistence
- E2E: non-scrollable content does not block viewport wheel behavior

Keep E2E assertions deterministic:
- Prefer functional assertions over fragile visual diffs for dynamic custom content
- Skip flaky scroll assertions unless test harness can control platform wheel behavior reliably

## Review Checklist

- Renderer key registration and cleanup are symmetric
- Unmount returns latest normalized state when persistence is required
- Non-scrollable wheel path passes through to viewport
- No framework-specific logic leaked into core classes/helpers
- Wrapper exports are complete for public helper APIs
- Unit + E2E coverage updated for behavior changes
