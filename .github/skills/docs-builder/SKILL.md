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

## Workflow

1. Identify which category the page belongs to.
2. Read the relevant pattern file from `patterns/`.
3. Author or edit the `.md` file in `website/docs/angular/`.
4. Register the page in `website/sidebars.ts` if it is new.
5. Verify `LiveDemo` references point to existing demo components.
