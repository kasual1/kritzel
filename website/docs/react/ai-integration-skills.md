---
sidebar_label: Skills
displayed_sidebar: tutorialSidebar
title: "AI Integration – Skills | Kritzel for React"
description: Add and use the kritzel-react skill for agentic coding.
---

# Skills

The `kritzel-react` skill gives your AI coding assistant deep, accurate context about the React wrapper — covering setup, component patterns, events, and all async editor APIs — so it can generate correct, idiomatic React code every time.

## What it covers

- Import-only setup (no provider or plugin required)
- Rendering `<KritzelEditor>` and `<KritzelEngine>`
- `useRef<HTMLKritzelEditorElement>` ref patterns
- `onIsReady` / `onIsEngineReady` readiness callbacks
- Stable prop memoization with `useMemo`
- All async editor API calls (`addObject`, `updateObject`, `setViewport`, etc.)
- Tools, workspaces, persistence, theming, and collaboration

## Adding the skill

Copy the skill folder into your repository:

```bash
# From the Kritzel repository root
cp -r .github/skills/kritzel-react <your-project>/.github/skills/kritzel-react
```

Or download it directly from the [Kritzel repository](https://github.com/kasual1/kritzel/tree/main/.github/skills/kritzel-react).

## Using the skill

In your agentic coding chat, invoke the skill and describe what you need:

```
/kritzel-react Set up a KritzelEditor with IndexedDB persistence and zoom controls.
```

The assistant will use React-specific patterns: `useRef`, `useState`, `useMemo`, and `await editorRef.current.addObject(...)`.

## Tips

- Skills are plain Markdown files; feel free to extend them with project-specific conventions.
- Reference files inside `references/` are loaded on demand for deeper topics (objects, viewport, events, etc.).
