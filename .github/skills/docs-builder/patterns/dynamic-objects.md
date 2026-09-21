# Pattern: Dynamic Objects

## Purpose

Use this pattern when documenting `KritzelDynamicObject` behavior, authoring dynamic object concept demos, or porting dynamic object demos across Angular, React, and Vue.

This pattern is derived from `libs/engine/core/src/classes/objects/dynamic-object.class.ts` and reflects the runtime contract maintainers must preserve.

## Core Runtime Contract

`KritzelDynamicObject` is a normal canvas object that embeds arbitrary HTML content while still participating in selection, movement, resize, ordering, serialization, and workspace persistence.

Hosting modes:
- Pure HTML mode: provide `element` only and let the object mount native DOM directly.
- Registry-rendered mode: provide `rendererKey` (and optional `rendererData`) so the registry can mount framework-specific runtime content (Angular/React/Vue or other runtimes).

Key persisted fields:
- `rendererKey`: optional registry key for lifecycle-driven rendering
- `rendererData`: optional state payload returned by renderer serialization/unmount
- `htmlString`: serialized fallback markup for compatibility

Mount behavior:
1. Apply interactivity state (`pointer-events` policy)
2. If `rendererKey` is set and registered, delegate to renderer `onMount`
3. Otherwise, fall back to mounting `element` directly
4. Avoid remount churn when already mounted to the same container

Unmount behavior:
1. If renderer exists, call `onUnmount`
2. If `onUnmount` returns a value, persist it into `rendererData`
3. Mark object unmounted

Serialization behavior:
1. If renderer exists and implements `onSerialize`, call it during copy/export
2. Persist the returned value into `rendererData`
3. Fall back to cloning the current `rendererData` when no hook is registered

## Documentation Rules for Usage

When writing docs or demos about dynamic objects:
1. Show both usage modes clearly:
- Direct DOM fallback (`element` only)
- Renderer-driven mode (`rendererKey` + `rendererData`) for framework-specific component/content mounting via the registry
2. Treat renderer lifecycle as symmetric:
- Register before object mount
- Cleanup (unregister + runtime teardown) when page/component unmounts
3. State persistence must flow through `rendererData`:
- Initialize from `rendererData`
- Return latest live state from `onSerialize` for clipboard copy/export
- Return latest state from `onUnmount`
4. Keep `rendererData` serializable (plain objects, arrays, primitives)

## Interactivity and Selection Rules

`KritzelDynamicObject` intentionally keeps the mount container clickable so an unselected object can still be selected while embedded content can be toggled between interactive and non-interactive.

Document this behavior explicitly when relevant:
- Container remains pointer-active for selection
- Embedded child content uses `pointer-events: auto|none` depending on object interactivity
- Focused descendants are blurred when interactivity is disabled to release keyboard input

## Wheel and Scroll Rules

Dynamic object content must not trap canvas navigation.

Documented expectation:
- If embedded content can scroll in wheel direction, keep wheel in custom content
- If it cannot scroll (no overflow or boundary reached), pass wheel to viewport

Always mention this for dynamic object demos that contain scrollable controls.

## Extension Rules (for New Renderer Types)

When documenting how to extend dynamic objects:
1. Define a stable renderer key
2. Register renderer in startup/mount phase
3. Normalize incoming `data` defensively
4. Return latest normalized state from `onSerialize` and `onUnmount`
5. Teardown all framework runtime artifacts (roots, component refs, listeners)
6. Unregister renderer on page/component destroy

## Vue-Specific Behavior (Important)

Vue requires extra care for embedded dynamic object content:
1. A regular Vue SFC mounted into an engine-managed host may not carry styles reliably, because style injection and host/shadow boundaries differ from standard app mounting.
2. Prefer a Vue custom element strategy (`defineCustomElement`) for embedded renderer content when styling/encapsulation matters.
3. In demos and docs, favor wrapper-level helper APIs (for example `registerVueDynamicObjectRenderer`) over ad-hoc page-local patches.
4. Keep using `getEditorRef`/`getEngineRef` for editor access in Vue pages; template refs target component instances, not native editor elements.

## Doc Author Checklist

Before finishing dynamic object docs/demo updates:
1. Route exists for every referenced demo path
2. `repoFiles` point to real files
3. Renderer registration and unregistration are both shown
4. `rendererData` init and serialization/unmount persistence flow is documented
5. Vue docs mention custom-element/encapsulation guidance when embedded Vue UI is shown
6. Any wheel/scroll behavior claims are aligned with current helper behavior
