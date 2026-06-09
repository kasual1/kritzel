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
| Concepts | `concept-*.md` | Explanations of architecture/mental models |
| API Reference | `api-reference*.md` | Generated or hand-written API surfaces |
| Guides | `quick-start.md`, `basic-usage.md` | Onboarding content |

## Patterns

Detailed conventions for each documentation category live in the `patterns/` subfolder:

- [`patterns/examples.md`](patterns/examples.md) — How to write, structure, and maintain example pages
- [`patterns/core-concept.md`](patterns/core-concept.md) — How to write, structure, and maintain core concept pages
- [`patterns/angular-demo-pages.md`](patterns/angular-demo-pages.md) — How to create Angular demo components that back `<LiveDemo>` embeds
- [`patterns/react-demo-pages.md`](patterns/react-demo-pages.md) — How to create React demo pages that back `<LiveDemo>` embeds
- [`patterns/vue-demo-pages.md`](patterns/vue-demo-pages.md) — How to create Vue demo pages that back `<LiveDemo>` embeds
- [`patterns/framework-porting.md`](patterns/framework-porting.md) — How to port Angular source docs to React and Vue consistently

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

## Workflow

1. Identify which category the page belongs to.
2. Read the relevant pattern file from `patterns/`.
3. Author or edit the `.md` file in `website/docs/angular/`.
4. Register the page in `website/sidebars.ts` if it is new.
5. Verify `LiveDemo` references point to existing demo components.

## Translation Workflow (When Explicitly Requested)

Normally, docs-builder focuses on Angular source docs only. If a task explicitly requests React and Vue equivalents, use `patterns/framework-porting.md` to perform a structured translation pass from Angular to both target frameworks.

When the translation also requires runnable framework demos, apply `patterns/react-demo-pages.md` and `patterns/vue-demo-pages.md` to implement and register corresponding demo routes.
