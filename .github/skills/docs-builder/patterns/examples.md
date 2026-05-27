# Pattern: Example Pages

## Overview

Example pages are progressive step-by-step guides that teach a single Kritzel feature by building it up incrementally. Each page lives at `website/docs/angular/example-<feature>.md` and uses the `<LiveDemo>` component to embed hosted previews alongside fetched source code.

## File Naming & Location

- File: `website/docs/angular/example-<feature>.md`
- Sidebar registration: add page ID (`example-<feature>`) to the `'Examples'` category in `website/sidebars.ts`

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

1. **`# <Feature>`** — intro paragraph: "This guide builds up X step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup."
2. **`## Prerequisites`** — link to Quick Start guide.
3. **`## How <Feature> Works`** — interface definition or brief conceptual explanation (1–2 paragraphs max).
4. **`## Step 1` through `## Step N`** — each step adds exactly one concept on top of the previous step.

## The LiveDemo Component

Each step includes a `<LiveDemo>` block that renders an iframe preview and fetches source code from GitHub:

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/<feature>-<step>"
  repoFiles={['src/app/examples/<feature>/<feature>-<step>.component.ts']}
/>
```

### Props

| Prop | Required | Description |
|------|----------|-------------|
| `repoUrl` | Yes | GitHub tree URL pointing to the demo project root |
| `iframeUrl` | Yes | URL of the hosted example (GitHub Pages) for the iframe preview |
| `repoFiles` | Yes | Array of file paths (relative to `repoUrl`) to fetch and display as source code |

### Conventions

- `repoUrl` always points to the Angular demo: `https://github.com/kasual1/kritzel-demos/tree/main/angular`
- `iframeUrl` uses the Angular GitHub Pages hash-router: `https://kasual1.github.io/kritzel-demos/angular/#/examples/<route>`
- `repoFiles` lists only files relevant to the current step. For the first step, include both files of step 1 and step 2 if step 2 builds directly on step 1's base. Otherwise, list only the current step's file.

## Demo Source Code

The actual Angular components backing each step live in:

```
demos/angular/src/app/examples/<feature>/
├── <feature>-1.component.ts
├── <feature>-2.component.ts
├── ...
└── <feature>-N.component.ts
```

Each component is a standalone Angular component following these rules:

- `ChangeDetectionStrategy.OnPush`
- Standalone pattern with `imports: [KritzelEditor]`
- `:host { display: block; height: 100%; }` for full-height layout
- Incremental: step N includes all code from step N-1 plus the new addition

## Step Writing Rules

### Each step must:

- Start from the output of the previous step (cumulative)
- Contain a `<LiveDemo>` block with the appropriate `iframeUrl` and `repoFiles`
- End with 1–2 sentences explaining what the new code does mechanically
- Be separated from the next step by a `---` horizontal rule

### Each step must NOT:

- Repeat unchanged code without purpose
- Introduce multiple unrelated concepts at once
- Include motivational phrasing ("useful when you want to...", "a real-world example...")
- Use backtick code references in headings

## Step Ordering Heuristic

Build up in this order when documenting a feature end-to-end:

1. **Bare minimum** — show the feature with the fewest possible options
2. **Defaults / initial state** — configure starting values
3. **Extend the set** — add more items (tools, options, menu entries)
4. **Type-specific config** — add per-item typed configuration
5. **Variants / sub-options** — expose multi-variant controls
6. **Programmatic control** — replace built-in UI with custom code

Not every feature needs all six levels — stop when the API surface is exhausted.

## Maintaining Existing Examples

When editing an existing example page:

1. Read the current page to understand the step progression.
2. Identify where the new content fits in the progression (insert between existing steps or append).
3. If inserting, renumber subsequent steps and update their `<LiveDemo>` references.
4. Ensure corresponding demo components exist in `demos/angular/src/app/examples/<feature>/`.
5. Verify routes are registered in the Angular demo's router config.

## Relationship to Other Frameworks

Example pages are written for **Angular only**. The React and Vue equivalents are created by a separate translation process. Do not create or edit files in `website/docs/react/` or `website/docs/vue/` when using this pattern.
