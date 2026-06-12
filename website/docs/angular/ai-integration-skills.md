---
sidebar_label: Skills
displayed_sidebar: tutorialSidebar
title: "AI Integration – Skills | Kritzel for Angular"
description: Add and use the kritzel-angular skill for agentic coding.
---

# Skills

The `kritzel-angular` skill gives your AI coding assistant deep, accurate context about the Angular wrapper — covering setup, component patterns, events, and all async editor APIs — so it can generate correct, idiomatic Angular code every time.

## What it covers

- `provideKritzel()` app config setup
- Rendering `<kritzel-editor>` and `<kritzel-engine>`
- `@ViewChild` ref patterns and `ChangeDetectionStrategy.OnPush` with signals
- `(isReady)` / `(isEngineReady)` readiness events
- All async editor API calls (`addObject`, `updateObject`, `setViewport`, etc.)
- Tools, workspaces, persistence, theming, and collaboration

## Adding the skill

Copy the skill folder into your repository:

```bash
# From the Kritzel repository root
cp -r .github/skills/kritzel-angular <your-project>/.github/skills/kritzel-angular
```

Or download it directly from the [Kritzel repository](https://github.com/kasual1/kritzel/tree/main/.github/skills/kritzel-angular).

## Using the skill

In your agentic coding chat, invoke the skill and describe what you need:

```
/kritzel-angular Add a button that programmatically inserts a KritzelText object at the center of the viewport.
```

The assistant will use Angular-specific patterns: `@ViewChild`, `ChangeDetectionStrategy.OnPush`, signals, and `await editor.addObject(...)`.

## Tips

- Skills are plain Markdown files; feel free to extend them with project-specific conventions.
- Reference files inside `references/` are loaded on demand for deeper topics (objects, viewport, events, etc.).
