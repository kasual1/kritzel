# Pattern: Cross-Framework Demo Reliability

## Purpose

Use this pattern whenever demo pages are created, moved, or ported across Angular, React, and Vue.

## Runtime Contract

1. Treat demo route paths as a contract.
- Route path must exist in the framework router.
- Any docs `<LiveDemo demoPath="...">` must match this route exactly.

2. Keep source-file references current.
- If demo files move folders, update all docs `repoFiles` references.
- Never leave stale `repoFiles` paths after refactors.

3. Preserve behavior parity when porting.
- Keep interaction behavior equivalent across frameworks.
- Keep API method intent equivalent even when component syntax differs.

4. Preserve dynamic object lifecycle parity when applicable.
- Keep renderer key semantics equivalent.
- Keep mount/unmount persistence behavior equivalent.
- Keep seed object behavior idempotent and deterministic.

## Framework Differences You Must Respect

1. File naming conventions:
- Angular page files: `kebab-case` with `.component.ts`
- React page files: `PascalCase` with `Page.tsx`
- Vue page files: `PascalCase` with `Page.vue`

2. Ref access conventions:
- Angular: direct via `viewChild`/`ElementRef`
- React: direct via `useRef<HTMLKritzelEditorElement | null>`
- Vue: use `getEditorRef` / `getEngineRef` from `kritzel-vue`

3. Router locations:
- Angular: `apps/demos/angular/src/app/app.routes.ts`
- React: `apps/demos/react/src/App.tsx`
- Vue: `apps/demos/vue/src/router.ts`

## Docs Integration Checks

When a docs page embeds a demo:

1. Confirm the route resolves in the target demo app.
2. Confirm `repoFiles` targets real files in the current folder structure.
3. Confirm framework-specific source extensions match reality:
- Angular `.ts`/`.component.ts`
- React `.tsx`
- Vue `.vue`

4. For local docs previews, verify `website/docusaurus.config.ts` `customFields.demoBaseUrls` points to running demo dev servers.

## Dynamic Object Reliability Checks

When a demo route uses `KritzelDynamicObject`:

1. Renderer registration and teardown are both implemented.
2. Unmount returns serializable state snapshot where persistence is expected.
3. Object factories are separated from page orchestration logic.
4. Per-object cleanup removes listeners/observers and mounted roots.
5. Seed guards prevent duplicate object insertion across reloads.

## Pre-Merge Checklist

1. New or changed demo route is registered.
2. Demo page renders without missing imports.
3. Theme application is intentional (framework theme by default).
4. Editor `editorId` is unique.
5. Docs links (`demoPath` and `repoFiles`) still resolve if applicable.
6. If dynamic objects are used, `patterns/dynamic-objects.md` checks are satisfied.
