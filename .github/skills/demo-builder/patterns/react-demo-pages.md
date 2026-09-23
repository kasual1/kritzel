# Pattern: React Demo Pages

## Overview

React demo pages are route components in `apps/demos/react/src/pages/`. They support direct demo app usage and docs `<LiveDemo>` embeds.

## File Location

| Category | Path template |
|---|---|
| Example demos | `apps/demos/react/src/pages/examples/<ExampleName>Page.tsx` |
| Fundamentals demos | `apps/demos/react/src/pages/fundamentals/<topic>/<TopicFocus>Page.tsx` |
| Other guides | `apps/demos/react/src/pages/<guide>/<GuidePage>.tsx` |

Follow existing folder conventions in the target area.

## Naming Convention

Use `PascalCase` component filenames with `Page.tsx` suffix.

Examples:
- `WorkspacesSwitchPage.tsx`
- `ToolsChangePage.tsx`

## Routing Registration

Register every new demo route in `apps/demos/react/src/App.tsx`.

1. Import page component.
2. Add matching `<Route path="..." element={<... />} />`.
3. Keep route path aligned with docs `demoPath`.

## Component Baseline

- Unique `editorId`
- `isPanningEnabled={false}` and `isZoomingEnabled={false}` by default
- Explicit `loginConfig={undefined}`
- Explicit visibility flags for more-menu and workspace-manager
- Explicit `syncConfig` for deterministic behavior

## Theming

Apply React framework theme by default:

1. Import `customReactTheme` from `apps/demos/react/src/const/custom-react-theme.ts`.
2. Set `theme="react-theme"`.
3. Set `themes={[customReactTheme]}`.

Skip only for demos intentionally showing neutral/default theme behavior.

## Editor / Engine Ref Access

React refs resolve directly to native elements. Use `useRef<HTMLKritzelEditorElement | null>(null)` (or engine equivalent) and call APIs on `ref.current`.

## Seeding Objects

When a demo needs initial object content, use a shared seed helper for consistent visuals and less duplicated setup code.

## Dynamic Objects

When a page uses `KritzelDynamicObject`:

1. Keep renderer setup and object factories in dedicated modules (not inline in the page component).
2. Register/unregister renderers in page lifecycle hooks.
3. Use guarded, idempotent `onReady` seeding and add factory-created objects through the editor ref.
4. Apply `patterns/dynamic-objects.md` for lifecycle, state, and cleanup rules.

## Docs LiveDemo Correspondence

If the demo is embedded in docs:

1. `demoPath` must match `apps/demos/react/src/App.tsx` route.
2. `repoFiles` must match real file locations.
3. Use `.tsx` file paths in docs.
