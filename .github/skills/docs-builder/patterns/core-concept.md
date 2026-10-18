# Pattern: Fundamentals Pages

## Overview

Fundamentals pages introduce fundamental architectural pillars of Kritzel (such as Viewport, Workspaces, Tools, Objects, Theming, Persistence). Unlike the exhaustive, deep-dive Example pages, Fundamentals pages are designed to give users a quick, high-level understanding of a concept, accompanied by very focused, small live-demo examples.

These pages bridge the gap between abstract architectural concepts and practical API usage.

## File Naming & Location

- File: `apps/website/docs/angular/fundamentals/<concept>.md` (or the corresponding framework directory)
- Sidebar registration: add page ID `fundamentals/<concept>` to the `Fundamentals` category in `apps/website/sidebars.ts`

## Frontmatter

```md
---
sidebar_label: <Concept Name>
displayed_sidebar: tutorialSidebar
title: "<Concept Name> Concept | Kritzel for Angular"
description: "Understand the fundamental concept of <Concept Name> in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';
```

## Page Structure

1. **`# <Concept Name>`** — The main page title.
2. **`## Overview`** — Explain what the concept is, its role within the Kritzel architecture, and why a developer should care. Keep it high-level.
3. **Use Case Sections (`##` or `###`)** — Provide multiple *very focused* live-demo examples showing users exactly how to accomplish specific, atomic tasks related to the concept. **Do not** use a literal `## Focused Use Cases` heading; instead, promote the use cases to top-level or natural descriptive headings (e.g., `## Using the Editor Component`).
4. **`## API Details`** — A quick bulleted list linking to the most relevant API reference sections associated with this concept.
  - Start with: `For the full list of related APIs, see the following reference sections.`
  - Link to top-level sections (e.g., `- [Viewport & Navigation](../api-reference/editor.md#viewport--navigation)`) rather than individual methods, props, events, or types.
  - Keep the list focused. Include multiple links only when the page genuinely covers distinct API sections.

## Focused Live-Demo Example Constraints

The examples on a Fundamentals page are **smaller** and **less detailed** than those on Example Pages (`examples.md`). 

- Focus on **"How to do ONE specific thing."**
- **Descriptive Text is Required:** Every section containing a `<LiveDemo>` MUST include descriptive text explaining the purpose of the demo.
- **Strict `<LiveDemo>` Usage:** NEVER use raw inline markdown code blocks (e.g., \`\`\`typescript\`) to demonstrate API usage. ALWAYS use the `<LiveDemo>` component to embed a working example.
- **Proactive Demo Creation:** If the underlying Angular component required for the `<LiveDemo>` does not exist in `apps/demos/angular/src/app/...`, you MUST proactively create it. Do not fall back to inline code simply because the demo file is missing.
- **Demo Routing Registration:** Whenever you create a new concept demo component, you must also register its route in the application's routing (`apps/demos/angular/src/app/app.routes.ts`) so the `iframeUrl` correctly resolves and the demo loads on the site.
- **No Duplicate Source Code:** Do not add raw code blocks below a `<LiveDemo>` embed. The `<LiveDemo>` component securely tracks and references the hosted code on GitHub.
- Do not build full, robust applications here; emphasize simplicity and clarity.
- **Do not** write extensive step-by-step tutorials here.

### `<LiveDemo>` Usage

Just like in the Examples pattern, embed previews with:
```jsx
<LiveDemo
  repoUrl="https://github.com/kritzeljs/kritzel/tree/main/apps/demos/angular"
  iframeUrl="https://kritzeljs.github.io/kritzel/angular/#/fundamentals/<concept>-<focus>"
  repoFiles={['src/app/fundamentals/<concept>/<concept>-<focus>.component.ts']}
/>
```

---

## Content Mapping (Fundamentals to API)

When authoring a Fundamentals page, draw upon the appropriate subset of the Kritzel Editor API:

### 1. Components (Editor, Engine)
- **Concept:** The relationship between the visual `<kritzel-editor>` and the headless `<kritzel-engine>`, showing they share identical public APIs exposing asynchronous methods (returning Promises).
- **Relevant Usage:** Mounting, basic sizing, and UI configuration (e.g., hiding or showing the workspace-manager or the more-menu).

### 2. Tools
- **Concept:** How the user interacts with the canvas via registered drawing/selection modes.
- **Relevant Usage:** 
  - `registerTool(toolName, toolClass, config)`
  - `changeActiveTool(toolName)`
  - `disable()`, `enable()`

### 3. Objects
- **Concept:** Elements drawn on the canvas and their lifecycles. Encompassing base objects, visibility, and selection matrices.
- **Relevant Usage:** 
  - Lifecycle: `addObject`, `removeObject`, `updateObject`, `getObjectById`.
  - Queries: `getAllObjects`, `findObjects`, `getObjectsTotalCount`, `getObjectsInViewport`.
  - Manipulation: `group`, `ungroup`, ordering functions (`bringToFront`, `sendBackward`, etc.), `alignObjects`.
  - Selection: `getSelectedObjects`, `selectObjects`, `clearSelection`.

### 4. Workspaces
- **Concept:** Managing multiple distinct document states or "pages" within a single Kritzel instance.
- **Relevant Usage:** 
  - `createWorkspace`, `updateWorkspace`, `deleteWorkspace`.
  - `getWorkspaces`, `getActiveWorkspace`.

### 5. Viewport
- **Concept:** Camera control, zooming, and panning behavior natively handled by Kritzel. Navigating infinite or bounded canvas structures.
- **Relevant Usage:** 
  - State reading: `getViewport`
  - Camera control: `setViewport`, `panTo`, `zoomTo`, `centerObjectInViewport`, `backToContent`.
  - Coordinate Mapping: `screenToWorld`, `worldToScreen`.

### 6. Theming
- **Concept:** Adapting the visual look of Kritzel tools, toolbars, and context menus via CSS overrides or configuration objects.

## AI Authoring & Editing Guidelines

Based on past learnings, always strictly follow these operational rules when updating documentation:

1. **Safe File Editing:** If a documentation file already exists, **NEVER** use terminal shell commands (like PowerShell's `Set-Content` or `echo`) to rewrite or overwrite the file. Shell escaping frequently corrupts Markdown syntax (e.g., turning ``` `method()` ``` into `\method()\`). Always use the system's native `replace_string_in_file` or edit tools to safely update file contents.
2. **Strict Markdown Formatting:** Ensure all methods, variable names, bindings, and components mentioned in paragraph text are properly wrapped in backticks (e.g., `` `[activeWorkspaceId]` ``). Do NOT escape backticks.
3. **Demo Component Integration:** Creating demo components requires a full loop:
  - Create the `<concept>-<focus>.component.ts` file in `apps/demos/angular/src/app/fundamentals/<concept>/`.
  - Update `apps/demos/angular/src/app/app.routes.ts` to import the file and add its route to the `fundamentals` children array.
   - Without the route, the `<LiveDemo>` iframe will fail to load the preview.
- **Relevant Usage:** (CSS Variable mapping and toolbar configuration objects).

### 7. Collaboration
- **Concept:** Real-time synchronization leveraging multiplayer providers (e.g., Yjs, Hocuspocus).
- **Relevant Usage:** Establishing connection configurations and tracking presence hooks.

## Porting Checklist (When Explicitly Requested)

Fundamentals pages are authored in Angular first. If React/Vue translations are explicitly requested, follow [`framework-porting.md`](framework-porting.md).

Quick checks before finishing:

1. Keep conceptual sections aligned across frameworks (Overview, focused demos, API Details).
2. Translate framework-specific naming in prose and snippets.
3. In React/Vue docs, use `<KritzelEditor>` and avoid `<kritzel-editor>`.
4. In Vue docs, use `html` fences for embedded component/template snippets.
5. Port `<LiveDemo>` with framework-specific `repoUrl` and matching `repoFiles` extensions.
6. Re-validate internal links for each framework docs tree.