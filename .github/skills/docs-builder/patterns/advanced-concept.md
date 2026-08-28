# Pattern: Advanced Pages

## Overview

Advanced pages explain specialized Kritzel integrations and capabilities that build on the core architecture, such as localization, custom fonts, collaboration, persistence providers, or dynamic object integrations. They should retain the concise, concept-first style of Fundamentals pages while documenting the additional configuration and framework integration details these features require.

## File Naming & Location

- Angular source page: `website/docs/angular/advanced/<concept>.md`.
- React translation: `website/docs/react/advanced/<concept>.md`.
- Vue translation: `website/docs/vue/advanced/<concept>.md`.
- Sidebar registration: add the document ID `advanced/<concept>` to the `Advanced` category in `website/sidebars.ts`.
- Keep the document path, sidebar ID, demo route, and demo source directory aligned for every framework.

## Frontmatter

```md
---
sidebar_label: <Concept Name>
displayed_sidebar: tutorialSidebar
title: "<Concept Name> Concept | Kritzel for Angular"
description: "Understand the advanced usage of <Concept Name> in Kritzel."
---

import LiveDemo from '@site/src/components/LiveDemo';
```

Use framework-specific titles for React and Vue translations. Keep the `displayed_sidebar` value consistent across all frameworks.

## Page Structure

1. **`# <Concept Name>`** — The main page title.
2. **`## Overview`** — Explain the capability, its role in Kritzel, and when developers should use it.
3. **Focused configuration sections** — Show atomic tasks such as enabling the feature, registering custom definitions, or handling runtime changes.
4. **`## Related API Methods`** — List the most relevant props, methods, events, providers, registries, or types.
5. End with an API Reference link relative to the page location: `[API Reference](../api-reference/editor.md)`.

Keep examples focused. Do not turn an Advanced page into a complete application tutorial.

## LiveDemo Requirements

- Every `<LiveDemo>` must have descriptive text explaining the focused behavior it demonstrates.
- Use the framework-specific demo repository URL and source path.
- Angular demos belong under `demos/angular/src/app/advanced/<concept>/` and use kebab-case `.component.ts` filenames.
- React demos belong under `demos/react/src/pages/advanced/<concept>/` and use PascalCase `Page.tsx` filenames.
- Vue demos belong under `demos/vue/src/pages/advanced/<concept>/` and use PascalCase `Page.vue` filenames.
- Demo routes must use `/advanced/<concept>-<focus>` and be registered in the matching framework router.
- `repoFiles` must point to files that exist at the current path. Never leave references to the old `concepts/` directories after moving a page.
- Do not duplicate the demo source in a Markdown code block below `<LiveDemo>`.

### Angular Example

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/advanced/<concept>-<focus>"
  repoFiles={['src/app/advanced/<concept>/<concept>-<focus>.component.ts']}
/>
```

### React Example

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  demoPath="/advanced/<concept>-<focus>"
  repoFiles={['src/pages/advanced/<concept>/<ConceptFocusPage.tsx']}
/>
```

### Vue Example

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  demoPath="/advanced/<concept>-<focus>"
  repoFiles={['src/pages/advanced/<concept>/<ConceptFocusPage.vue']}
/>
```

## Framework Integration

- Angular routes belong in `demos/angular/src/app/app.routes.ts` under the `advanced` route group.
- React routes belong in `demos/react/src/App.tsx` with matching imports and `/advanced/...` paths.
- Vue routes belong in `demos/vue/src/router.ts` with matching imports and `/advanced/...` paths.
- React and Vue prose should refer to `<KritzelEditor>`, not `<kritzel-editor>`.
- Vue documentation snippets that show component or template markup use `html` fences.
- Keep Angular as the source of truth, then port structure and meaning to React and Vue with framework-specific syntax.

## Validation Checklist

1. The page exists under `website/docs/<framework>/advanced/`.
2. The sidebar contains `advanced/<concept>` for every configured docs plugin.
3. Every LiveDemo route exists in the target framework router.
4. Every `repoFiles` path exists in the target demo project.
5. Nested API links use `../` from the advanced directory.
6. No stale `/concepts/...` demo paths or `src/.../concepts/...` source paths remain.
7. The Angular, React, and Vue builds pass when translations and demos are requested.
