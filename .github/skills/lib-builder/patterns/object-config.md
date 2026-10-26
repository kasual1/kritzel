# Object Config Pattern

## Scope

Use this pattern when maintaining the `objectConfig` prop (`KritzelObjectConfig`) that configures object behavior in one place for all objects (`hasTitlebar`, `isRotatable`, `isResizable`), or when adding a new option to it.

Primary touchpoints:
- `libs/engine/core/src/interfaces/object-config.interface.ts` — `KritzelObjectConfig`, each option typed inline as `boolean | ((object: KritzelBaseObject) => boolean)` (no alias, so hovers and generated docs show the signature); the TSDoc here is the public documentation of every option
- `libs/engine/core/src/classes/managers/object-config.manager.ts` — `KritzelObjectConfigManager`: live config read, per-option resolution, group/selection rules, warn-once
- `libs/engine/core/src/classes/core/core.class.ts` — creates the manager and exposes it as `core.objectConfigManager`
- `libs/engine/core/src/components/kritzel-engine/kritzel-engine.tsx` — `@Prop() objectConfig`, `@Watch('objectConfig')`, `getSelectionHandleCapabilities` (handle rendering)
- `libs/editor/core/src/components/kritzel-editor/kritzel-editor.tsx` — `@Prop() objectConfig`, forwarded unchanged to `<kritzel-engine>`
- Enforcement points: `classes/handlers/rotation.handler.ts`, `classes/handlers/resize.handler.ts`, `classes/managers/object-titlebar.manager.ts` (`getOwners`, see [object-titlebar.md](object-titlebar.md))
- Public exports: `KritzelObjectConfig` and the manager are exported from `libs/engine/core/src/index.ts` and re-exported by the engine and editor wrappers (`react/lib/index.ts`, `vue/lib/index.ts`, `angular/.../public-api.ts`); `objectConfig` is in the Angular proxy `inputs` and the Vue `components.ts` prop lists of both packages

## Maintainer Mental Model

`objectConfig` is app-level, local configuration: it is read live from the engine prop, belongs to one engine instance and is never persisted or synced. Persisted per-object state stays on the object (`isRotatable` / `isResizable` on `KritzelBaseObject`, serialized with it). Where both exist, they **combine as restrictions**: either one can forbid, neither can force-allow over the other.

Every option answers one yes/no question per object. Callers never read `engine.objectConfig` directly; they ask the manager (`hasTitlebar(object)`, `isRotatable(object)`, `isResizable(object)`), which owns defaults, group rules and failure handling.

## Configuration Is Read Live

- `KritzelObjectConfigManager.config` returns `this._core.engine?.objectConfig ?? undefined` on every access — never copy the config or cache resolved values (lib-builder rules 8–9)
- `@Watch('objectConfig')` only calls `core.objectConfigManager.resetWarnings()`, `core.objectTitlebarManager.resetWarnings()` (re-arms the missing-`hasTitlebar` hint) and `core.rerender()`
- Functions are re-evaluated on every render and on every relevant pointerdown; apps whose functions read their own state pass a new config object, which the watcher turns into a rerender
- `kritzel-editor` has no watcher of its own; it forwards the prop and the engine's watcher handles changes. Keep the prop name identical on both components and in all wrapper proxies

## Resolution Rules

`evaluate(key, object, fallback)` resolves one option for one object:

| Config value | Result |
|---|---|
| `undefined` (option or whole config missing) | `fallback` (the option's default) |
| non-function | `value === true` |
| function returning a boolean | that boolean |
| function returning a non-boolean | `fallback`, no warning |
| function returning a thenable | `fallback`, warns once for the option |
| function throwing | `fallback`, warns once for the option |

- Defaults: `hasTitlebar` → `false`; `isRotatable` / `isResizable` → `true`
- Warnings go through `warnOnce(key)` into `_warnedKeys` (one `console.warn` per option, prefixed `[KritzelObjectConfig]`); `resetWarnings()` clears the set
- `isConfigured(key)` reports whether the app set an option at all; the titlebar manager uses it to skip owner resolution and log its one-time hint
- `hasTitlebar(object)` evaluates the object only — no descendant walk
- `isRotatable(object)` / `isResizable(object)` go through `allowsAll(object, check)`, where `check` is `unit.<flag> !== false && evaluate(key, unit, true)`:
  - `KritzelSelectionGroup` → every entry of `objects` must pass (the selection group itself is never passed to the app function)
  - any other object must pass `check` itself
  - `KritzelGroup` → additionally every `childIds` entry resolved through `store.objects.findById` must pass, recursively; ids that no longer resolve are skipped
- Type checks use `KritzelClassHelper.isInstanceOf(object, '<ClassName>')` (compares `__class__`), never `instanceof`, so duplicated engine bundles keep working; children are walked through `childIds`, not the `children` getter
- The flag check runs before the app function, so the function is not called for an object whose own flag already forbids it

## Where Each Option Is Enforced

| Option | Rendering | Input |
|---|---|---|
| `hasTitlebar` | `KritzelObjectTitlebarManager.getOwners` filters top-level candidates with `objectConfigManager.hasTitlebar(candidate)` as the last condition | — (no bar, no titlebar press) |
| `isRotatable` | `getSelectionHandleCapabilities(object).canRenderRotationHandle` → rotation handle hidden | `KritzelRotationHandler.handlePointerDown` (mouse and single-touch branches) requires `objectConfigManager.isRotatable(selectionGroup)` before `beginTransform()` |
| `isResizable` | `getSelectionHandleCapabilities(object).canRenderResizeHandles` → resize handles hidden | `KritzelResizeHandler.handlePointerDown` (mouse and single-touch branches) requires `objectConfigManager.isResizable(selectionGroup)` before `beginTransform()` |

- Always guard both the handle rendering and the handler. Hiding the handle alone is not enough: the handler must not trust that a set `isRotationHandleSelected` / `isResizeHandleSelected` flag implies the gesture is allowed, e.g. when the config changes between render and pointerdown
- Line endpoint handles (`line-handle.handler.ts`) are not covered by `isResizable`; a line's endpoints stay editable
- Programmatic API calls (`updateObject`, alignment, undo/redo, sync) are deliberately not restricted — the config limits user gestures only

## Adding a New Option

Planned follow-ups: `isMovable`, `isDeletable`, `isCopyable`, `isSelectable`, `isEditable`.

1. **Interface** — add the optional key to `KritzelObjectConfig` with TSDoc stating the default, whether it combines with a persisted object flag, and the group rule. Type the value inline as `boolean | ((object: KritzelBaseObject) => boolean)`, like the existing options; do not add arrays, id lists or async variants
2. **Manager** — add a public method named like the option. Pick the default (`true` for permissions, `false` for opt-in features). If the object already has a persisted flag of the same meaning (e.g. `isEditable`), combine it inside `check` (`unit.flag !== false && this.evaluate(...)`). Use `allowsAll` when the gesture transforms everything inside a group or selection (move, delete, copy); evaluate the object only when it is about the object itself (as `hasTitlebar`)
3. **Enforcement points** — find every user-gesture entry point and guard it with the manager method, both the UI affordance (handle, menu item, toolbar/shortcut enablement) and the handler/tool that would start the action. Candidates: `move.handler.ts` and titlebar drag (`isMovable`); `key.handler.ts` delete/copy/cut/paste shortcuts, context-menu items and the editor's delete/copy buttons (`isDeletable`, `isCopyable`); `selection.handler.ts`, the selection tool, selection box hit-testing and `selectObjects` from pointer input (`isSelectable`); text/shape edit entry in `selection.handler.ts` and the text/shape tools (`isEditable`). Leave programmatic API methods unrestricted unless a decision says otherwise
4. **Engine/editor** — no new prop or watcher is needed; the existing `objectConfig` watcher covers new keys. Keep `getSelectionHandleCapabilities`-style helpers delegating to the manager instead of re-implementing rules in the component
5. **Docs** — update the generated API reference via the normal build (not by hand), the user skill (`.github/skills/kritzel/references/{react,vue,angular}/objects.md`, section "Object configuration (`objectConfig`)", plus any feature reference that the option affects), the website docs under `apps/website/docs/{angular,react,vue}/`, and this pattern (enforcement table and follow-up list)
6. **Tests** — see the matrix below; add one case per enforcement point that the forbidden option blocks the gesture

## Rules

- One prop for all object behavior: do not add sibling props (`isRotationEnabled`, …) or per-feature `showFor`-style functions on other configs; extend `KritzelObjectConfig` instead
- Restrictions only combine with persisted flags; never let the config override a persisted `false`
- Keep resolution synchronous; never add promise support to `evaluate()`
- Never mutate objects or the store from the manager; it only answers questions
- Never persist or sync the config, and never copy resolved results onto objects
- Report failures once per option via `warnOnce`; never throw out of a manager method
- Use `__class__` checks via `KritzelClassHelper.isInstanceOf` and `childIds` lookups, never `instanceof` or `children`
- New public types must be exported from the engine barrel and every wrapper (see the lib-builder Public Exports section)

## Testing Matrix

- Unit: `object-config.manager.spec.ts` — defaults without a config, live config read, booleans and functions, non-boolean results, throwing and promise-returning functions (default + warn once per option), persisted flags combined with the config, nested groups, config applied to group children, unresolvable child ids, selection groups, `hasTitlebar` not asking children
- Unit: `rotation.handler.spec.ts` / `resize.handler.spec.ts` — the gesture does not start (`beginTransform` not called, `isRotating` / `isResizing` stays `false`) when the manager forbids it; the core mock needs `objectConfigManager: { isRotatable / isResizable: jest.fn().mockReturnValue(true) }`
- Unit: `kritzel-engine.spec.ts` — `getSelectionHandleCapabilities` delegates to the manager and hides forbidden handles; the `objectConfig` watcher resets both managers' warnings and rerenders
- Unit: `object-titlebar.manager.spec.ts` — owners via `hasTitlebar`, missing-option hint (see object-titlebar.md)
- E2E: `apps/core/_e2e/tests/object-config.spec.ts` — default handles, `isRotatable: false`, per-object `isResizable` function, multi-selection, group with a non-rotatable child, runtime config change; titlebar selection in `object-titlebar.spec.ts`

## Review Checklist

- Config read live; watcher only resets warnings (both managers) and rerenders
- Every new option has a documented default and uses `evaluate()`
- Group/selection semantics match the gesture (`allowsAll` for transforms)
- Both the affordance and the handler/tool are guarded
- Programmatic APIs still unrestricted; line endpoints still editable
- Interface TSDoc, user skill references, website docs and this pattern updated together
