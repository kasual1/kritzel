---
name: kritzel-docs-example
description: "Create or extend Kritzel usage example documentation. Use when writing docs that show how to use Kritzel features (toolbar, tools, config, events, API), authoring example .md files for the website, or ensuring examples follow the established progressive-step format. Covers Angular, React, and Vue."
argument-hint: "Describe the feature or API surface to document"
---

# Kritzel Documentation — Example Pages

## When to Use

- Writing a new `example-*.md` page in `website/docs/<framework>/`
- Extending an existing example with more steps
- Reviewing whether an example follows project conventions

## File Conventions

| Property | Value |
|---|---|
| File name | `example-<feature>.md` in `website/docs/<framework>/` |
| Frontmatter `displayed_sidebar` | `tutorialSidebar` |
| Frontmatter `title` | `"<Feature> Example \| Kritzel for <Framework>"` |
| Frontmatter `sidebar_label` | Short label shown in sidebar nav |

> **After creating the file**, register it in `website/sidebars.ts` by adding the page ID (filename without `.md`) to the `items` array of the `'Examples'` category. The page will not appear in the sidebar until this is done.

**Frontmatter template:**
```md
---
sidebar_label: Custom Toolbar
displayed_sidebar: tutorialSidebar
title: "Custom Toolbar Example | Kritzel for Angular"
description: "One-sentence summary of what the page demonstrates."
---
```

---

## Page Structure

Every example page follows this fixed structure:

1. `# <Feature>` — intro sentence: "This guide builds up X step by step, starting from a bare minimum and progressively adding configuration until reaching a fully controlled setup."
2. `## Prerequisites` — install command + minimal bootstrap code (provideKritzel, standalone component import)
3. `## How <Feature> Works` — interface definition or conceptual model, 1–2 paragraphs max
4. `## Step 1: <First increment>` through `## Step N: <Last increment>` — each step adds one concept to the previous

> **Never** add a "Real-World Use Cases" section. Do not frame steps as solving user problems. Each step is described purely by what it adds.

---

## Step Writing Rules

### Each step must:
- Start from the output of the previous step (cumulative, not standalone)
- Show only the **diff** — highlight new lines using Docusaurus annotations:
  - Always use `// highlight-start` / `// highlight-end`, even for a single line. Never use `// highlight-line`.
- End with 1–2 sentences explaining what the addition does or why it matters mechanically
- Use `---` (horizontal rule) to separate steps

### Each step must NOT:
- Repeat unchanged code without purpose (truncate with `// ...` only if block would exceed ~50 lines)
- Introduce multiple unrelated concepts at once
- Mention motivations like "useful when you want to..." or "a real-world example of this is..."
- Use backtick code references in headings (e.g. `## Step 4: Mutating an Object with \`updateObject()\`` is forbidden — write `## Step 4: Mutating an Object` instead)

---

## Angular-Specific Patterns

### Bootstrap
```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideKritzel } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [provideKritzel()],
};
```

### Component skeleton
```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor></kritzel-editor>`,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {}
```

**Rules:**
- Always use `ChangeDetectionStrategy.OnPush`
- Always use standalone component pattern (`imports: [...]` in decorator)
- Always set `display: block; width: 100%; height: 100vh` on the host element
- Use `@ViewChild(KritzelEditor) editor!: KritzelEditor` (not `ElementRef`) when API access is needed
- Use Angular `signal()` for reactive state (e.g., active tool name)

### Imports
Only import what is actually used in the current step's code. Add imports incrementally across steps with `// highlight-line` on each new import line.

---

## Source Files to Consult

Before writing examples, read the relevant source to confirm interface shapes and defaults:

| What | Where |
|---|---|
| Public exports | `libs/kritzel-angular/projects/lib/src/public-api.ts` |
| Real usage reference | `demos/angular/src/app/editor-page.component.ts` |

---

## Step Ordering Heuristic

Build up in this order when documenting a feature end-to-end:

1. **Bare minimum** — show the feature with the fewest possible options (just make it work)
2. **Defaults / initial state** — configure starting values
3. **Extend the set** — add more items (tools, options, entries)
4. **Type-specific config** — add per-item typed configuration
5. **Variants / sub-options** — expose multi-variant controls
6. **Programmatic control** — replace built-in UI with custom code

Not every feature needs all six levels — stop when the API surface is exhausted.
