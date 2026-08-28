# Pattern: Angular Demo Pages

## Overview

Angular demo pages are standalone Angular components that back demo routes in `demos/angular`. These routes are used directly by local demo development and by docs `<LiveDemo>` embeds.

## File Location

| Category | Path template |
|---|---|
| Example demos | `demos/angular/src/app/examples/<example-name>.component.ts` |
| Fundamentals demos | `demos/angular/src/app/fundamentals/<topic>/<topic>-<focus>.component.ts` |
| Other guides | Follow existing folder conventions under `demos/angular/src/app/` |

## Naming Convention

Use `kebab-case` filenames with a `.component.ts` suffix.

Examples:
- `workspaces-switch.component.ts`
- `tools-change.component.ts`

## Routing Registration

Every new Angular demo component must be registered in `demos/angular/src/app/app.routes.ts`.

1. Import the component.
2. Add it to the correct `children` route group.
3. Keep route path aligned with docs `demoPath`/`iframeUrl` if the demo is documented.

## Component Baseline

- Standalone component style (no NgModules)
- `ChangeDetectionStrategy.OnPush`
- Host layout fills available height
- Unique `editorId`
- Disable iframe-unfriendly camera controls by default:
  - `[isPanningEnabled]="false"`
  - `[isZoomingEnabled]="false"`
- Explicit `loginConfig`, more-menu, and workspace-manager visibility for deterministic demos

## Theming

Apply Angular theme by default:

1. Import `customAngularTheme`.
2. Set `themes = [customAngularTheme]`.
3. Bind `[theme]="'angular-theme'"` and `[themes]="themes"`.

Skip framework theme only when the demo intentionally needs a neutral baseline (for example theming-focused pages).

## Editor / Engine Ref Access

Angular refs resolve directly to native elements:
- Editor: `HTMLKritzelEditorElement`
- Engine: `HTMLKritzelEngineElement`

Use `viewChild` + `ElementRef` for direct API calls.

## Seeding Objects

When demos need preloaded canvas content, prefer `createSeedObjects()` from `demos/angular/src/app/const/seed-objects.ts` for visual consistency across demos.

## Dynamic Objects

When a page uses `KritzelDynamicObject`:

1. Keep renderer setup and object factories in dedicated files instead of bloating the page component.
2. Register/unregister renderers inside component lifecycle paths.
3. Use idempotent seed guards before adding dynamic objects.
4. Apply `patterns/dynamic-objects.md` for shared lifecycle, state, and cleanup rules.

## Docs LiveDemo Correspondence

If the demo is embedded in docs:

1. `iframeUrl` route must match `app.routes.ts` route path exactly.
2. `repoFiles` must point to actual component file paths.
3. Update docs references immediately when moving files.
