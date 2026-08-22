# Pattern: React Demo Pages

## Overview

React demo pages are route components in `demos/react/src/pages/`. They support direct demo app usage and docs `<LiveDemo>` embeds.

## File Location

| Category | Path template |
|---|---|
| Example demos | `demos/react/src/pages/examples/<feature>/<FeatureExamplePage>.tsx` |
| Concept demos | `demos/react/src/pages/fundamentals/<concept>/<ConceptFocusPage>.tsx` |
| Other guides | `demos/react/src/pages/<guide>/<GuidePage>.tsx` |

Follow existing folder conventions in the target area.

## Naming Convention

Use `PascalCase` component filenames with `Page.tsx` suffix.

Examples:
- `WorkspacesSwitchPage.tsx`
- `ToolsChangePage.tsx`

## Routing Registration

Register every new demo route in `demos/react/src/App.tsx`.

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

1. Import `customReactTheme` from `demos/react/src/const/custom-react-theme.ts`.
2. Set `theme="react-theme"`.
3. Set `themes={[customReactTheme]}`.

Skip only for demos intentionally showing neutral/default theme behavior.

## Editor / Engine Ref Access

React refs resolve directly to native elements. Use `useRef<HTMLKritzelEditorElement | null>(null)` (or engine equivalent) and call APIs on `ref.current`.

## Seeding Objects

When a demo needs initial object content, use a shared seed helper for consistent visuals and less duplicated setup code.

## Custom-Element Objects

When a page uses `KritzelCustomElement`:

1. Keep renderer setup and object factories in dedicated modules (not inline in the page component).
2. Register/unregister renderers in page lifecycle hooks.
3. Use guarded, idempotent `onReady` seeding and add factory-created objects through the editor ref.
4. Apply `patterns/custom-element-objects.md` for lifecycle, state, and cleanup rules.

## Docs LiveDemo Correspondence

If the demo is embedded in docs:

1. `demoPath` must match `demos/react/src/App.tsx` route.
2. `repoFiles` must match real file locations.
3. Use `.tsx` file paths in docs.
