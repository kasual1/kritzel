# Object Titlebar Pattern

## Scope

Use this pattern when maintaining the optional titlebar rendered above objects (`objectTitlebar` prop for content and appearance, `objectConfig.hasTitlebar` for which objects get a bar, `name` object field, `objectTitlebarAction` event). The `objectConfig` prop itself and its resolution are covered by [object-config.md](object-config.md).

Primary touchpoints:
- `libs/engine/core/src/interfaces/object-titlebar.interface.ts` — public config, item, context and event types
- `libs/engine/core/src/classes/managers/object-titlebar.manager.ts` — owner/active resolution (owners via `core.objectConfigManager.hasTitlebar`), item evaluation, button invocation, `KRITZEL_DEFAULT_OBJECT_TITLEBAR`
- `libs/engine/core/src/classes/managers/object-config.manager.ts` — resolves `objectConfig.hasTitlebar` per object (see object-config.md)
- `libs/engine/core/src/helpers/object-titlebar.helper.ts` — pure geometry (anchor, transform, culling padding, pixel parsing)
- `libs/engine/core/src/components/kritzel-object-titlebar-layer/kritzel-object-titlebar-layer.tsx` + `.css` — internal `<kritzel-object-titlebar-layer>` component (`shadow: false`, so parts and `elementsFromPoint` reach the bars; listed in `INTERNAL_COMPONENTS` of the engine and editor Stencil configs); the engine passes it the resolved titlebars every render
- `libs/engine/core/src/components/kritzel-engine/kritzel-engine.tsx` — prop, event, render query, pointer guards, rotation handle offset, screenshot filter
- `classes/tools/selection-tool.class.ts`, `classes/handlers/selection.handler.ts`, `classes/handlers/context-menu.handler.ts`, `classes/tools/base-tool.class.ts` (+ text/shape tools), `classes/managers/cursor.manager.ts`
- `classes/objects/base-object.class.ts` (`name`), `classes/objects/group.class.ts` (`copy()` carries `name`), `classes/objects/text.class.ts` (`adjustSizeOnInput` rerender), every object class (`name?` in its config interface, set in its constructor)
- `libs/editor/core/src/components/kritzel-editor/kritzel-editor.tsx` — passes `objectTitlebar` and `objectConfig` through and re-emits `objectTitlebarAction`

## Maintainer Mental Model

The titlebar configuration is declared once (left / center / right item arrays) and applies to every object; it only describes content and appearance. Which objects get a bar is `objectConfig.hasTitlebar` (a boolean or `(object) => boolean`, default `false`), resolved by `KritzelObjectConfigManager.hasTitlebar`. There is no per-object persisted flag, so apps that toggle bars per object keep their own state, read it inside `hasTitlebar` and pass a new `objectConfig` object. The persisted, synced `name` is the default title.

Flow on every engine render:
1. `getMetrics(computedStyle)` reads `--kritzel-titlebar-height` and `--kritzel-titlebar-offset` (px only)
2. `store.getObjectsInViewport(getCullingPadding(metrics))` widens the render query by the bar band, only while `objectTitlebar` is set (padding `0` otherwise, so the default query is unchanged)
3. `resolveTitlebars(visibleObjects)` picks owners, computes anchors and evaluates every item into a `KritzelResolvedTitlebar`
4. `<ObjectTitlebarLayer>` renders the bars inside `#origin`; buttons call back into `invokeItem`

## Configuration Is Read Live

- `KritzelObjectTitlebarManager.config` returns `this._core.engine?.objectTitlebar` on every access — never copy the config into the manager (lib-builder rules 8–9)
- `@Watch('objectTitlebar')` only calls `resetWarnings()` and `core.rerender()`
- `@Watch('objectConfig')` calls `objectConfigManager.resetWarnings()`, `objectTitlebarManager.resetWarnings()` (re-arms the missing-`hasTitlebar` hint) and `core.rerender()`
- `hasTitlebar` is re-evaluated on every render and never cached; apps get a re-evaluation after changing their own state by passing a new `objectConfig` reference, which the watcher turns into a rerender
- `kritzel-editor` forwards both props unchanged; keep the prop names identical on both components and in all wrapper proxies

## Owner and Active Resolution

- Owners are candidates that are not `markedForRemoval`, not a `KritzelSelectionGroup` / `KritzelSelectionBox`, not listed in any candidate group's `childIds` (top-level only), and for which `core.objectConfigManager.hasTitlebar(candidate)` is `true`. That check is the last condition of the filter, so the app's function is never called for removed objects, grouped children or selection objects
- Failure handling lives in the object config manager: a throw, a thenable or a non-boolean result resolves to `false` (the `hasTitlebar` default), and throws/thenables warn once per option with a `[KritzelObjectConfig]` prefix. The titlebar manager has no try/catch of its own for this
- When `objectConfigManager.isConfigured('hasTitlebar')` is `false`, `getOwners` returns `[]` before scanning candidates and, only while `objectTitlebar` is set (`isEnabled`), logs a one-time `console.info` hint guarded by `_hasReportedMissingHasTitlebar`. `resetWarnings()` re-arms both `_warnedItems` and `_hasReportedMissingHasTitlebar`
- `hasTitlebar` is asked about the candidate only, never about a group's children (unlike `isRotatable` / `isResizable`, which require all descendants)
- A group's bounds contain its children, so a visible child's group is always a candidate; children never render their own bar, and the group gets one only if `hasTitlebar` returns `true` for it (no special group rules)
- Active = the owner itself, or anything nested inside it, is in `store.selectionGroup.objectIds` (walk child → parent through `childIds`, guarded against cycles)
- Title resolution order: item `text` > `config.title(object)` > `object.name` > localized `objectType.*` term (`objectType.object` fallback). Add a term in every locale file when a new object class needs its own label

## Item Evaluation

- `KritzelTitlebarValue<T>` is `T | (context) => T`, evaluated synchronously on every render
- `evaluate()` wraps callbacks in try/catch, rejects thenables, and returns the fallback (`false` for booleans); failures go through `warnOnce(itemId)` so a broken callback does not flood the console. `resetWarnings()` runs on config change
- Button `label` / `tooltip` go through `localizationManager.translate`, which returns unknown keys verbatim, so plain strings work
- `invokeItem` re-resolves owner and item by id, honors `isDisabled`, runs `action` in try/catch, then always emits `objectTitlebarAction`; it is a no-op while the store is disabled
- Keep `context.children` a lazy getter — resolving group children scans the store

## Rendering

- The layer is rendered inside `#origin` after the objects, at `z-index: 9997`: above objects, below anchor lines (9998), snap indicators (9999) and selected-object selection UI (10000+)
- Each anchor is `translate(x, y) rotate(deg) scale(1 / scale)`, so one CSS pixel equals one screen pixel at any zoom and the bar follows pan/zoom/drag in the same frame as its object
- `rotation: 'follow'` anchors on `rotatedPolygon.topLeft` with the object's rotation; `'upright'` anchors on `rotatedBoundingBox` with no rotation. Only axis-aligned anchors are pixel-snapped
- Bars narrower than `hideBelowWidth` (default 40 screen px) are skipped; `minBarWidth` hides single items
- Bars are never part of object bounds: do not add the band to `boundingBox`, hit polygons or the selection box
- `getRotationHandleTitlebarOffset` lifts the rotation handle by `height + offset` when a selected owner's bar would cover it
- The viewport screenshot filter drops `.object-titlebar-layer`; keep that filter when touching export code
- `KritzelText.adjustSizeOnInput` triggers `core.rerender()` after measuring a size change while `objectTitlebarManager.isEnabled`, because the bar width comes from the measured object

## Pointer Integration

Two DOM markers drive everything (constants exported from the manager):

| Attribute | On | Meaning |
|---|---|---|
| `data-kritzel-titlebar-control` | buttons | Interactive control; the engine `pointerdown` listener returns early (`isControlEvent`), so no tool, viewport or long-press logic runs. `pointerup` / `pointercancel` skip tool logic for untracked pointers (`wasTracked`) |
| `data-titlebar-owner-id` | bar surface | Drag surface that stands for its owner object |

- `getOwnerFromEvent` walks `composedPath()` first and falls back to `shadowRoot.elementsFromPoint`: long-press callbacks receive the original event after dispatch (empty path), and pointer capture retargets later events such as `contextmenu` to the engine host
- `SelectionTool.handleTitlebarPointerDown` runs after the handle flags (`isResizeHandleSelected`, rotation, line handles) are set and before `getSelectedObject`, so handles drawn over a bar win. It only uses `core.selectObjects([owner])` (or `selectionHandler.toggleObjectInSelection` on Shift/Ctrl) plus `moveHandler.handlePointerDown` — never a custom move path, so undo, sync, snapping and anchors stay identical to dragging the object. `draggable: false` skips the move handler
- Pressing the bar of an already selected object keeps a multi-selection (selection tool and context-menu handler)
- `SelectionHandler.skipEditForPointerId` suppresses `edit()` on the matching pointerup, so clicking a text object's bar does not enter edit mode
- Embedded objects selected through the bar get `setIsInteractive(false)` until release (`deferEmbeddedInteractivity`), otherwise an iframe captures the pointer mid-drag
- Touch: the previous selection is saved in `_savedSelectionGroupForPinch`; a second finger cancels the pending drag and restores it
- `TextTool` / `ShapeTool` call `continueTitlebarPress(event)` after a press ends an edit and switches to the selection tool, so that press continues as select-and-drag
- Surface `pointer-events` is `auto` only for the selection tool or while editing text/shape, `none` while scaling or drawing; buttons keep `pointer-events: auto`
- Keyboard: buttons are tabbable only on active bars; `Enter`, `Space`, `Tab` and arrow keys on a focused control are not global shortcuts. Pointer clicks blur the button so canvas shortcuts keep working
- The cursor manager shows the hand cursor over the surface, not over controls

## Renaming Through the Title

- Opt-in per title item: `isEditable?: KritzelTitlebarValue<boolean>` (default `false`), resolved in `resolveItems` as `resolved.isEditable`; always `false` when the item has a `text` override. Editable titles carry `data-kritzel-titlebar-editable-title="<itemId>"`
- Trigger (click-again, like editing a selected text): `SelectionTool.handleTitlebarPointerDown` records a candidate only when the owner already is the only selected object and `getEditableTitleFromEvent` (event path, then `elementsFromPoint`) finds its editable title, without Shift/Ctrl. `finishTitlebarGesture` calls `objectTitlebarManager.startTitleEditing(ownerId, itemId)` if the pointer moved at most `TITLE_EDIT_CLICK_TOLERANCE` (5px). The press still drags as usual
- State lives in the manager: `_editingTitle` and `_titleDraft`. `resolveTitlebars` keeps the edited bar visible (exempt from `visibility: 'active'` and `hideBelowWidth`) and sets `editingItemId`. If the title is no longer rendered or editable, or the owner is no longer selected or exists, the edit ends: the draft is committed if one was typed, otherwise it is dropped
- The layer renders an `<input>` (`part="titlebar-title-input"`, control + `data-kritzel-titlebar-title-input` attributes). Its value is set once in `ref` (guarded by `dataset.initialized`) so per-frame renders never overwrite typing; `onInput` → `setTitleDraft`, Enter/blur → `commitTitleEditing`, Escape → `cancelTitleEditing`
- `commitTitleEditing` trims, maps `''` to `undefined`, and when the name changed assigns `owner.name` directly (not `core.updateObject`, which skips `undefined`), calls `onAfterUpdate(['name'])`, `store.objects.update(owner)` (one undo step, synced), `emitObjectsChange()` and `emitObjectsUpdated([{ object, changedProperties: ['name'] }])`. It never deselects
- `shouldHandleGlobalShortcutEvent` returns `false` first for `isTitleInputEvent(ev)`, so Delete, Escape, undo and clipboard shortcuts stay in the input
- Tests: manager `title editing` block, layer `title editing` block, selection tool `object titlebar › title editing`, engine `titlebar title input`, e2e `Object titlebar › renaming`

## Theming and Parts

- Tokens live in the `titlebar` theme section (`titlebar` is in `KNOWN_CATEGORIES` of `scripts/generate-theme-interface.js`); keep `light-theme.ts` and `dark-theme.ts` in sync and update the variable count in `helpers/theme.helper.spec.ts`
- `height` and `offset` must stay px values: they are parsed for culling and the rotation handle offset (`parsePixels` falls back to 28 / 6)
- Expose new elements through `part` names (`titlebar`, `titlebar-active`/`-inactive`, `titlebar-left|center|right`, `titlebar-title|text|icon|button|button-pressed|separator`, plus `item.part`) rather than new props

## Rules

- Never put `class="object"` (or anything matched by `getObjectFromPointerEvent(event, '.object')`) on titlebar elements
- Never write wildcard custom-property names such as `--kritzel-titlebar-*` in `libs/**/src` files, including comments: the theme generator scans every `.ts`, `.tsx` and `.css` file and would emit a bogus token
- Keep dynamic values synchronous; do not add promise support to `evaluate()` here or in the object config manager
- `objectConfig.hasTitlebar` is the only per-object switch: a boolean or a function that receives just the object, with no bars by default. Do not add a persisted opt-in flag, array shorthands, helper functions or a second switch on `objectTitlebar` for it
- Keep the manager framework-agnostic and free of DOM writes; the layer is a functional component fed by resolved data
- New object fields shared by all types go on `KritzelBaseObject` and, if settable at construction, into each object config interface and constructor (as `name` is); `serialize()` / `deserialize()` pick them up automatically
- Never add `protected` or `private` members to `KritzelBaseObject` (or other public object classes): Vue's `ref()` unwrapping drops non-public members, so objects kept in a `ref` would no longer type-check as `KritzelBaseObject`. Put shared construction logic in a static helper instead
- New public symbols must be exported from the engine barrel and all three wrapper `index.ts` / `public-api.ts` files

## Testing Matrix

- Unit: `object-titlebar.helper.spec.ts` (anchors, transform, padding, pixel parsing) and `object-titlebar.manager.spec.ts` (live config read, owners via `objectConfig.hasTitlebar` (missing hint once and only while enabled, grouped children excluded, not asked for removed/grouped/selection objects), active state, title order, evaluation and warnings, owner lookup fallbacks, invocation)
- Unit: `selection-tool.class.spec.ts`, `selection.handler.spec.ts`, `context-menu.handler.spec.ts`, `text-tool` / `shape-tool` specs for pointer behavior
- Unit: `object-config.manager.spec.ts` (`hasTitlebar` default, values, failures and warnings; see object-config.md)
- Unit: `kritzel-engine.spec.ts` (prop watchers, control pointer guard, shortcut keys, screenshot filter, event) and `kritzel-editor.spec.ts` (event re-emission)
- Unit: `store.class.spec.ts` (padded query), `group.class.spec.ts` (`copy()` keeps the name), `theme.helper.spec.ts` (variable count)
- E2E: `apps/core/_e2e/tests/object-titlebar.spec.ts` — `objectConfig.hasTitlebar` selection, constant size across zoom, hide below width, active state, drag + undo, buttons, text edit suppression, groups, context menu, theme variables, `::part()`

## Review Checklist

- Config still read live; watcher only resets warnings and rerenders
- `objectConfigManager.hasTitlebar` evaluated last, only for top-level candidates; failures reported once by the object config manager, a missing `hasTitlebar` reported once by the titlebar manager
- Render query padding is `0` when `objectTitlebar` is unset
- No titlebar element carries the `object` class; controls carry the control attribute, surfaces the owner attribute
- Titlebar presses go through `selectObjects` / toggle + `moveHandler` only
- Bars excluded from bounds, hit tests and screenshots
- Light/dark tokens, generated theme interface and variable-count test updated together
- Demos at `/customization/titlebar/configure` and `/customization/titlebar/styling` match across Angular, React and Vue
