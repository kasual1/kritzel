# Pattern: Example Pages

## Overview

Example pages demonstrate a single Kritzel feature through multiple **self-contained, realistic use cases**. Each example on the page is a complete, copy-paste-ready implementation that solves a real scenario a developer might encounter. Examples are ordered from simple to advanced, but every example stands alone — a developer can grab any single one without needing the others.

Each page lives at `apps/website/docs/angular/examples/<feature>.md` and uses the `<LiveDemo>` component to embed hosted previews alongside fetched source code.

## File Naming & Location

- File: `apps/website/docs/angular/examples/<feature>.md`
- Sidebar registration: add page ID (`examples/<feature>`) to the `'Examples'` category in `apps/website/sidebars.ts`

## Frontmatter

```md
---
sidebar_label: <Short Label>
displayed_sidebar: tutorialSidebar
title: "<Feature> Example | Kritzel for Angular"
description: "<One-sentence summary of what the page demonstrates.>"
---

import LiveDemo from '@site/src/components/LiveDemo';
```

## Page Structure

1. **`# <Feature>`** — intro paragraph describing what the page covers and what kind of use cases the reader will find.
2. **`## Prerequisites`** — link to Quick Start guide.
3. **`## Featured Concepts`** — a short list of the key Kritzel concepts showcased in this demo. Each item is a concept name linked to its dedicated documentation page so users can read about it in detail. Keep this to 2–5 bullet points. Do NOT explain the concepts inline — let the linked pages do the teaching.
4. **`## <Use Case Title>` sections** — each section is a complete, self-contained example named after the scenario it solves (e.g., "Annotation-Only Toolbar", "Diagramming Toolbar", "Custom External Toolbar").

### Featured Concepts Format

```md
## Featured Concepts

This example makes use of the following core concepts. Follow the links for an in-depth look:

- [Toolbar Configuration](/docs/angular/toolbar) — controlling which tools appear and how they're grouped
- [Theme Customization](/docs/angular/themes) — applying branded colors to the editor
- [Event Handling](/docs/angular/events) — reacting to user interactions on the canvas
```

Each bullet follows the pattern: `[Concept Name](link) — one-line description of how it's used in this demo`. Only link concepts that the demo actually exercises.

## The LiveDemo Component

Each example includes a `<LiveDemo>` block that renders an iframe preview and fetches source code from GitHub:

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/demos/angular"
  iframeUrl="https://kasual1.github.io/kritzel/demos/angular/#/examples/<feature>-<example-name>"
  repoFiles={['src/app/examples/<feature>/<feature>-<example-name>.component.ts']}
/>
```

### Props

| Prop | Required | Description |
|------|----------|-------------|
| `repoUrl` | Yes | GitHub tree URL pointing to the demo project root |
| `iframeUrl` | Yes | URL of the hosted example (GitHub Pages) for the iframe preview |
| `repoFiles` | Yes | Array of file paths (relative to `repoUrl`) to fetch and display as source code |

### Conventions

- `repoUrl` always points to the Angular demo: `https://github.com/kasual1/kritzel/tree/main/demos/angular`
- `iframeUrl` uses the Angular GitHub Pages hash-router: `https://kasual1.github.io/kritzel/demos/angular/#/examples/<route>`
- `repoFiles` lists all files needed to understand the example. Include helper files, services, or secondary components if the example uses them.

## Demo Source Code

The actual Angular components backing each example live in:

```
apps/demos/angular/src/app/examples/<feature>/
├── <feature>-<example-name>.component.ts
├── <feature>-<example-name>.component.ts
└── ...
```

Each component is a standalone Angular component following these rules:

- `ChangeDetectionStrategy.OnPush`
- Standalone pattern with `imports: [KritzelEditor]`
- `:host { display: block; height: 100%; }` for full-height layout (or `display: flex` when using side panels)
- **Self-contained**: every example includes all the code needed to work independently — no relying on a "previous step" for context

## Example Writing Rules

### Each example section must contain (in order):

1. **Scenario description** (1–3 sentences) — describe what the workspace provides and what interactions are available to the user. Write from the user's perspective ("Users can toggle...", "Clicking a row automatically pans..."). Do not explain implementation — just the experience.
2. **Admonition** (optional) — a `:::info` or `:::tip` callout highlighting a non-obvious API distinction, a common pitfall, or an important behavioral nuance. Use when the demo exercises an API whose behavior differs from what a developer might assume (e.g., `centerObjectInViewport()` moves the object vs `setViewport()` moves the camera).
3. **`<LiveDemo>` block** — the embedded preview and source code.
4. **Implementation notes** (1–2 paragraphs) — explain the key patterns used in the source code. Focus on *why* specific API calls are made and in what order. Mention the lifecycle hook where setup happens (typically `onReady()`), call out ordering dependencies (e.g., "the background image is added first so annotations render on top"), and name the specific API methods used for the core interaction (e.g., `screenToWorld()`, `changeActiveToolByName()`).

### Scenario description rules:

- Write from the end-user's perspective — describe what they see and can do
- Mention the key interactive affordances (buttons, click actions, sidebar controls)
- Do NOT explain code or APIs in this section — save that for implementation notes
- Keep to 1–3 sentences maximum

### Admonition rules:

- Use `:::info <Title>` format with a short descriptive title
- Reserve for genuinely non-obvious behavior — do not use for basic API explanations
- The content should prevent a common mistake or clarify a confusing distinction
- Not every example needs an admonition — only add when there's a real "gotcha"

### Implementation notes rules:

- Appear after the `<LiveDemo>` block
- Explain the *why* behind the code — not a line-by-line walkthrough
- Mention specific API method names with backtick formatting
- Call out ordering dependencies, lifecycle hooks, and interaction patterns
- Keep to 1–2 short paragraphs — this is not a tutorial
- Do NOT repeat information already covered in the linked concept pages

### Each example must:

- Solve a realistic, named scenario (not "Step 3" but "Diagramming Toolbar with Shapes and Lines")
- Be fully self-contained — a developer can copy it without reading other examples
- Contain a `<LiveDemo>` block with the appropriate `iframeUrl` and `repoFiles`
- Be separated from the next example by a `---` horizontal rule

### Each example must NOT:

- Reference or depend on code from other examples on the same page
- Be named generically ("Step 1", "Basic", "Advanced") — use scenario names
- Include motivational filler ("useful when you want to...", "imagine a scenario...")
- Combine too many unrelated API features — keep focus on one coherent scenario
- Use backtick code references in headings

## Example Ordering Heuristic

Order examples from simple use cases to complex ones:

1. **Simple real scenario** — the most common, minimal use of the feature (e.g., "Annotation-Only Toolbar" with just select + brush)
2. **Domain-specific scenario** — a use case tailored to a specific domain (e.g., "Diagramming Toolbar" with shapes, lines, text)
3. **Fully configured scenario** — a production-ready setup with all options configured (e.g., "Full Drawing App Toolbar" with separators, sub-options, palettes)
4. **Custom integration scenario** — replacing built-in UI with custom code or integrating with external state (e.g., "Custom External Toolbar" hiding built-in controls)

Not every feature needs all four levels — stop when the API surface is covered with realistic scenarios. Aim for 3–5 examples per page.

## Naming Examples

Use descriptive, scenario-based names that tell the developer what they'll build:

| Instead of | Use |
|---|---|
| "Step 1: Minimal toolbar" | "Annotation-Only Toolbar" |
| "Step 2: Adding more tools" | "Diagramming Toolbar" |
| "Step 3: Full configuration" | "Full Drawing App with Branded Colors" |
| "Step 4: Programmatic control" | "Custom External Toolbar" |
| "Basic context menu" | "Canvas-Level Quick Actions" |
| "Advanced context menu" | "Object Inspector Menu with Submenus" |

The heading doubles as the scenario name. It should immediately tell the reader what they will end up with after copying the code.

## Maintaining Existing Examples

When editing an existing example page:

1. Read the current page to understand the existing scenarios.
2. Identify whether the new content fits as a new scenario (append) or refines an existing one (edit in place).
3. Ensure corresponding demo components exist in `apps/demos/angular/src/app/examples/<feature>/`.
4. Verify routes are registered in the Angular demo's router config.
5. Each example component file should be named after the scenario slug, not a number (e.g., `custom-toolbar-annotation.component.ts` not `custom-toolbar-1.component.ts`). During the transition period, numbered files are acceptable.

## Styling Rules for Demo Components

Custom UI elements (side panels, filter bars, layer panels, toolbars, status displays) that sit alongside the `<kritzel-editor>` must follow these rules:

### Font Family

Every component must set an explicit `font-family` on `:host`. Do **not** rely on browser defaults or use elaborate system font stacks (no `-apple-system, BlinkMacSystemFont, ...`).

```css
:host {
  font-family: Roboto, sans-serif;
}
```

### Framework-Themed Colors

Custom UI must use the framework's theme colors — never generic Bootstrap-style blues or arbitrary colors.

| Token | Angular value | Usage |
|-------|--------------|-------|
| Primary | `#dd0031` | Active buttons, hover accents, selected states |
| Primary hover | `#b30027` | Active button borders, pressed states |
| Text | `#333333` | Default text in panels and lists |
| Border | `#ebebeb` | Panel borders, dividers between editor and sidebar |
| Item border | `#eee` | List item separators |
| Inactive button bg | `#f0f0f0` | Non-active filter/toggle buttons |

When a button or element has an "active" or "selected" state, use the primary color as background with white text — matching the theme's `controls.selected` pattern.

Hover states on clickable text (spans, links) should change color to the primary color rather than using only `text-decoration: underline`.

### Why

Readers copy these examples as starting points. If custom UI uses generic colors, the result looks inconsistent with the themed editor. By using framework-specific colors everywhere, the example looks polished and production-ready out of the box.

## Relationship to Other Frameworks

Example pages are written for **Angular only**. The React and Vue equivalents are created by a separate translation process. Do not create or edit files in `apps/website/docs/react/` or `apps/website/docs/vue/` when using this pattern.

## Porting Checklist (When Explicitly Requested)

If a task explicitly requests React/Vue equivalents, apply [`framework-porting.md`](framework-porting.md) after the Angular source page is finalized.

Quick checks before finishing:

1. React/Vue pages preserve the Angular section structure and scenario order.
2. Framework naming is translated in frontmatter and prose (no Angular-specific wording where framework-specific).
3. React/Vue docs use `<KritzelEditor>` (not `<kritzel-editor>`).
4. Vue embedded component/template snippets use `html` fences (not `vue`).
5. `<LiveDemo>` uses framework-specific `repoUrl` and file extensions (`.tsx` for React, `.vue` for Vue).
6. Links in translated pages resolve to existing framework docs.
