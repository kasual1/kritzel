# Pattern: React Demo Pages

## Overview

React demo pages are the React components that back `<LiveDemo>` embeds in documentation pages. They are rendered in the React demo app via hash routes and referenced by docs using `demoPath` and `repoFiles`.

## File Location

| Category | Path template |
|----------|--------------|
| Example demos | `demos/react/src/pages/examples/<feature>/<FeatureExamplePage>.tsx` |
| Concept demos | `demos/react/src/pages/concepts/<concept>/<ConceptFocusPage>.tsx` |
| Guide demos | `demos/react/src/pages/<guide>/<GuidePage>.tsx` |

Use existing folder conventions in the target repo. If the feature already has a dedicated folder (for example `basic-usage/`), keep using it.

## File Naming Convention

**React page component files use `PascalCase` with a `Page` suffix** (e.g. `WorkspacesSwitchPage.tsx`, `ToolsChangePage.tsx`). This follows the standard React community convention where component files are PascalCase. The exported component name matches the filename.

Folder names stay `kebab-case` (e.g. `workspaces/`, `context-menus/`). Non-component utility/helper files (e.g. `concept-shared.ts`, `seed-objects.ts`) stay `kebab-case` — PascalCase applies to component files only.

## Routing Registration

Every React demo page must be registered in `demos/react/src/App.tsx`:

1. Import the page component.
2. Add a `<Route path="..." element={<... />} />` entry.
3. Ensure the route path exactly matches the docs `demoPath`.

Without the route, the `<LiveDemo>` preview iframe will not load.

## Component Scaffold

```tsx
import { useMemo } from 'react';
import {
  InMemorySyncProvider,
  KritzelEditor,
  type KritzelSyncConfig,
} from 'kritzel-react';
import { customReactTheme } from '../../const/custom-react-theme';

export function MyDemoPage() {
  const syncConfig = useMemo<KritzelSyncConfig>(
    () => ({ providers: [InMemorySyncProvider] }),
    [],
  );

  return (
    <KritzelEditor
      editorId="my-demo"
      wheelEnabled={false}
      syncConfig={syncConfig}
      theme="react-theme"
      themes={[customReactTheme]}
      loginConfig={undefined}
      isMoreMenuVisible={false}
      isWorkspaceManagerVisible={false}
    />
  );
}
```

## Framework Theming (REQUIRED by default)

Every React demo page should apply the React framework theme unless the docs explicitly require neutral/default rendering.

1. Import `customReactTheme` from `demos/react/src/const/custom-react-theme.ts`.
2. Bind `theme="react-theme"` and `themes={[customReactTheme]}`.

Only skip these bindings when the page intentionally demonstrates built-in default themes or theme switching from a neutral baseline.

## Required Editor Props

Every `<KritzelEditor>` in a React demo page should include:

| Prop | Purpose |
|------|---------|
| `editorId="<unique-id>"` | Prevents state collision across demos |
| `wheelEnabled={false}` | Prevents scroll-jacking in docs iframes |
| `syncConfig={...}` | Explicit sync provider behavior |
| `loginConfig={undefined}` | Disables login dialog in demos |
| `isMoreMenuVisible={false}` | Hides more-menu unless required |
| `isWorkspaceManagerVisible={false}` | Hides workspace manager unless required |
| `theme="react-theme"` | Applies framework theme |
| `themes={[customReactTheme]}` | Provides theme definition |

## Seeding Objects

When a demo needs initial canvas content, use a shared helper (`createSeedObjects`) local to the framework demo app and seed during readiness handling.

Benefits:
- Consistent visuals across docs demos
- Less duplicate setup code
- Easier maintenance when shapes change

## LiveDemo Correspondence

`<LiveDemo>` in docs must point to the exact route and source file:

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/react"
  repoFiles={['src/pages/<folder>/<PageName>.tsx']}
  demoPath="/<route>"
/>
```

Rules:
- `demoPath` must match the route in `demos/react/src/App.tsx` exactly.
- `repoFiles` paths must match the real file location and current folder layout.
- If files are moved (for example from `examples/` to `basic-usage/`), update docs immediately.

## Local Preview Reliability

For docs preview during local development:

1. Ensure React demo server is running on the expected port.
2. Ensure `website/docusaurus.config.ts` local `demoBaseUrls.react` matches that port.
3. Verify `demoPath` resolves manually in browser (for example `http://localhost:5173/#/basic-usage`).

If any of these three are out of sync, the docs embed will appear broken even when page code exists.
