# Pattern: Vue Demo Pages

## Overview

Vue demo pages are SFC route components in `apps/demos/vue/src/pages/`. They support direct demo usage and docs `<LiveDemo>` embeds.

## File Location

| Category | Path template |
|---|---|
| Example demos | `apps/demos/vue/src/pages/examples/<ExampleName>Page.vue` |
| Fundamentals demos | `apps/demos/vue/src/pages/fundamentals/<topic>/<TopicFocus>Page.vue` |
| Other guides | `apps/demos/vue/src/pages/<guide>/<GuidePage>.vue` |

Follow existing folder conventions in the target area.

## Naming Convention

Use `PascalCase` filenames with `Page.vue` suffix.

Examples:
- `WorkspacesSwitchPage.vue`
- `ToolsChangePage.vue`

## Routing Registration

Register every new demo route in `apps/demos/vue/src/router.ts`.

1. Import page component.
2. Add route entry.
3. Keep route path aligned with docs `demoPath`.

## Component Tag Rule

Use `<KritzelEditor>` from `kritzel-vue`. Do not use `<kritzel-editor>` directly in Vue demo pages.

## Component Baseline

- Unique `editorId`
- Disable panning/zooming by default for iframe safety
- Explicit `loginConfig`, menu visibility, workspace-manager visibility
- Explicit sync provider behavior

## Theming

Apply Vue framework theme by default:

1. Import `customVueTheme` from `apps/demos/vue/src/const/custom-vue-theme.ts`.
2. Set `theme="vue-theme"`.
3. Set `:themes="[customVueTheme]"`.

Skip only for intentionally neutral/theming-baseline demos.

## Editor / Engine Ref Access (Vue-specific)

Use `getEditorRef` / `getEngineRef` from `kritzel-vue`.

Vue template refs on wrapper components point at component instances, not directly at native custom elements. The composables resolve native `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement` safely.

## Seeding Objects

Use shared seed helpers when demos need initial canvas content to keep visuals and behavior consistent.

## Dynamic Objects

When a page uses `KritzelDynamicObject`:

1. Keep renderer setup and object factory logic in dedicated modules, not inline in the page SFC.
2. Register/unregister renderers in lifecycle hooks.
3. Seed via guarded, idempotent setup flow.
4. Apply `patterns/dynamic-objects.md` for general lifecycle, persistence, and cleanup expectations.

## Docs LiveDemo Correspondence

If the demo is embedded in docs:

1. `demoPath` must match `apps/demos/vue/src/router.ts` route.
2. `repoFiles` must match real file locations.
3. Use `.vue` file paths in docs.
