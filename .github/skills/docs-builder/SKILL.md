---
name: docs-builder
description: "Create, edit, and maintain Docusaurus documentation pages for the Kritzel website. Covers example pages, API reference pages, and conceptual docs. Use when iterating on content inside website/docs/."
argument-hint: "Describe the doc page to create or edit"
---

# Docs Builder — Kritzel Website Documentation

## When to Use

- Creating or editing any `.md` page inside `website/docs/`
- Adding a new example page, concept page, or API reference page
- Reviewing whether a doc follows project conventions
- Registering pages in sidebars

## Important: Angular-First Workflow

**All documentation is authored targeting the Angular implementation only.** The `website/docs/angular/` folder is the source of truth. A separate skill (`kritzel-docs-example` or a future translation skill) handles porting content to `website/docs/react/` and `website/docs/vue/`.

When working with docs-builder:

1. Write and refine content for Angular exclusively.
2. Reference Angular demo components in `demos/angular/src/app/examples/`.
3. Use Angular-specific code snippets, imports, and patterns.
4. Do **not** attempt to create or update React/Vue docs — that is handled by a dedicated translation step.

This separation ensures consistency: one authoritative source is written once, then mechanically translated for other frameworks.

## Project Layout

| Path | Purpose |
|------|---------|
| `website/docs/angular/` | Angular documentation pages (source of truth) |
| `website/docs/react/` | React docs (translated from Angular — do not edit directly) |
| `website/docs/vue/` | Vue docs (translated from Angular — do not edit directly) |
| `website/sidebars.ts` | Sidebar navigation config |
| `website/src/components/LiveDemo/` | `<LiveDemo>` component for embedded previews |
| `demos/angular/src/app/examples/` | Actual Angular example source code |

## Documentation Categories

| Category | File prefix | Description |
|----------|-------------|-------------|
| Examples | `example-*.md` | Progressive step-by-step guides showing feature usage |
| Core Concepts | `concept-*.md` in the framework docs root | Foundational architecture and mental models |
| Advanced Concepts | `advanced-concepts/concept-*.md` | Specialized integrations and advanced capabilities |
| API Reference | `api-reference*.md` | Generated or hand-written API surfaces |
| Guides | `quick-start.md`, `basic-usage.md` | Onboarding content |

## Patterns

Detailed conventions for each documentation category live in the `patterns/` subfolder:

- [`patterns/examples.md`](patterns/examples.md) — How to write, structure, and maintain example pages
- [`patterns/core-concept.md`](patterns/core-concept.md) — How to write, structure, and maintain core concept pages
- [`patterns/advanced-concept.md`](patterns/advanced-concept.md) — How to write, structure, and maintain advanced concept pages
- [`patterns/framework-porting.md`](patterns/framework-porting.md) — How to port Angular source docs to React and Vue consistently
- [`patterns/custom-elements.md`](patterns/custom-elements.md) — How to document and demo `KritzelCustomElement` lifecycle, renderer state persistence, wheel behavior, and Vue-specific embedding constraints

For runnable demo implementation under `demos/**`, use the `demo-builder` skill:

- `.github/skills/demo-builder/patterns/angular-demo-pages.md`
- `.github/skills/demo-builder/patterns/react-demo-pages.md`
- `.github/skills/demo-builder/patterns/vue-demo-pages.md`
- `.github/skills/demo-builder/patterns/cross-framework-demo-reliability.md`

## Cross-Framework LiveDemo Reliability Rules

Apply these rules whenever docs include `<LiveDemo>` (especially during Angular -> React/Vue translation):

1. Treat `demoPath` as a runtime contract.
- `demoPath` must resolve in the target demo app router (`react/src/App.tsx`, `vue/src/router.ts`, `angular/src/app/app.routes.ts`).
- If the route does not exist, create it before finishing docs edits.

2. Keep `repoFiles` and actual demo file paths in sync.
- If demo files move folders (for example from `examples/` to `basic-usage/`), update docs immediately.
- Never leave stale `repoFiles` paths after restructuring demo source.

3. Validate local preview base URLs used by Docusaurus.
- `<LiveDemo demoPath="...">` resolves via `website/docusaurus.config.ts` (`customFields.demoBaseUrls`).
- During local development, ensure each framework's base URL points to the actual running dev server port.

4. Prefer explicit framework parity checks after porting.
- For each translated page, confirm: route exists, demo renders, code tab loads files, and framework-specific imports/snippets are correct.

5. Keep docs source-of-truth and translation scope explicit.
- Angular remains source-of-truth by default.
- When a task explicitly requests React/Vue updates, perform full translation plus demo wiring checks, not markdown-only edits.

6. Account for framework-specific editor/engine ref access.
- Vue demos must resolve the editor/engine via the `getEditorRef` / `getEngineRef` composables from `kritzel-vue` (a Vue template ref points at the component instance, not the native element).
- Angular and React resolve the native `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement` directly (Angular `viewChild`/`ElementRef`, React `useRef`) — no composable needed.
- See `.github/skills/demo-builder/patterns/vue-demo-pages.md` ("Editor / Engine Ref Access") for the required Vue usage.

7. For custom-element documentation, apply lifecycle and framework constraints.
- Load `patterns/custom-elements.md` whenever docs or demos cover `KritzelCustomElement`, `rendererKey`, or `rendererData`.
- In Vue-facing custom-element docs, explicitly call out style/encapsulation caveats and prefer Vue custom-element based renderer strategies over ad-hoc SFC mounting.

## Workflow

1. Identify which category the page belongs to.
2. Read the relevant pattern file from `patterns/`.
3. Author or edit the `.md` file in `website/docs/angular/`.
4. Register the page in `website/sidebars.ts` if it is new.
5. Verify `LiveDemo` references point to existing demo components.

## Translation Workflow (When Explicitly Requested)

Normally, docs-builder focuses on Angular source docs only. If a task explicitly requests React and Vue equivalents, use `patterns/framework-porting.md` to perform a structured translation pass from Angular to both target frameworks.

When the translation also requires runnable framework demos, apply `demo-builder` patterns to implement and register corresponding demo routes.
