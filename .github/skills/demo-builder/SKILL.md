---
name: demo-builder
description: "Create, edit, and maintain runnable Kritzel demo pages in apps/demos/angular, apps/demos/react, and apps/demos/vue. Covers routing, framework themes, editor/engine refs, and docs LiveDemo compatibility. Use when implementing demo components under apps/demos/."
argument-hint: "Describe the demo page or demo feature to create or update"
---

# Demo Builder - Kritzel Framework Demos

## When to Use

- Creating or editing runnable demo pages in `apps/demos/angular/`, `apps/demos/react/`, or `apps/demos/vue/`
- Registering new demo routes in Angular, React, or Vue routers
- Aligning demo paths and source files with docs `<LiveDemo>` embeds
- Porting equivalent demos across frameworks while preserving behavior
- Adding demo-specific custom UI next to the editor or engine

## Scope

This skill owns demo implementation patterns for files under `apps/demos/**`.

It complements docs-builder:
- docs-builder owns markdown authoring in `website/docs/**`
- demo-builder owns runnable demo source in `apps/demos/**`

## Project Layout

| Framework | Demo root | Route registry |
|---|---|---|
| Angular | `apps/demos/angular/src/app/` | `apps/demos/angular/src/app/app.routes.ts` |
| React | `apps/demos/react/src/pages/` | `apps/demos/react/src/App.tsx` |
| Vue | `apps/demos/vue/src/pages/` | `apps/demos/vue/src/router.ts` |

## Categories and Routes

Demo folders mirror the documentation categories, and **the route is the folder path**:
`apps/demos/<fw>/<root>/fundamentals/tools/<file>` is served at `/fundamentals/tools/<name>`.

| Category | Folder | Example route |
|---|---|---|
| Getting Started | `getting-started/` | `/getting-started/quick-start` |
| Fundamentals | `fundamentals/<topic>/` (+ flat `fundamentals/components/`) | `/fundamentals/tools/disable` |
| Advanced | `advanced/<topic>/` | `/advanced/collaboration/local` |
| Customization | `customization/<topic>/` | `/customization/theming/apply` |
| Examples | `examples/` (flat, one file per example) | `/examples/object-explorer` |
| E2E harness | `e2e/` | `/e2e/editor` |

The final route segment drops the folder-derived prefix that the file name keeps
(`fundamentals/tools/tools-disable.component.ts` -> `/fundamentals/tools/disable`), so file
names stay unique and greppable while routes stay short and mirror the docs URLs.

## Patterns

- `patterns/angular-demo-pages.md` - Angular standalone demo components
- `patterns/react-demo-pages.md` - React demo page components
- `patterns/vue-demo-pages.md` - Vue demo page components
- `patterns/dynamic-objects.md` - General dynamic object setup and lifecycle rules
- `patterns/cross-framework-demo-reliability.md` - Path parity, docs integration, and framework equivalence checks

## Workflow

1. Identify target framework and demo category (getting-started, fundamentals, advanced, customization, examples, e2e).
2. Load the framework pattern and scaffold/update the demo page.
3. Register the route in the framework router.
4. Verify editor id uniqueness, theme wiring, and iframe-safe panning/zoom behavior.
5. If the page uses `KritzelDynamicObject`, load and apply `patterns/dynamic-objects.md`.
6. If docs `<LiveDemo>` references this demo, validate route and repo file path parity.
7. If porting, run cross-framework checks from `patterns/cross-framework-demo-reliability.md`.
