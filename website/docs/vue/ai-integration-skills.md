---
sidebar_label: Skills
displayed_sidebar: tutorialSidebar
title: "AI Integration – Skills | Kritzel for Vue"
description: Add and use the kritzel-vue skill for agentic coding.
---

# Skills

The `kritzel-vue` skill gives your AI coding assistant deep, accurate context about the Vue wrapper — covering setup, component patterns, events, and all async editor APIs — so it can generate correct, idiomatic Vue code every time.

## What it covers

- Import-only setup (no plugin or `app.use` required)
- Rendering `<KritzelEditor>` and `<KritzelEngine>`
- `getEditorRef` / `getEngineRef` composables for resolving the native element from a template ref
- `@isReady` / `@isEngineReady` readiness event bindings
- Stable `:prop` binding patterns to avoid unnecessary re-renders
- All async editor API calls (`addObject`, `updateObject`, `setViewport`, etc.)
- Tools, workspaces, persistence, theming, and collaboration

## Adding the skill

Copy the skill folder into your repository:

```bash
# From the Kritzel repository root
cp -r .github/skills/kritzel-vue <your-project>/.github/skills/kritzel-vue
```

Or download it directly from the [Kritzel repository](https://github.com/kasual1/kritzel/tree/main/.github/skills/kritzel-vue).

## Using the skill

In your agentic coding chat, invoke the skill and describe what you need:

```
/kritzel-vue Register a custom tool and add it to the toolbar controls array.
```

The assistant will use Vue-specific patterns: `<script setup>`, `getEditorRef`, `ref()`, and `await editor.value?.addObject(...)`.

## Tips

- Skills are plain Markdown files; feel free to extend them with project-specific conventions.
- Reference files inside `references/` are loaded on demand for deeper topics (objects, viewport, events, etc.).
