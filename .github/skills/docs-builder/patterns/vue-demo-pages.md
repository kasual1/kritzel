# Pattern: Vue Demo Pages

## Overview

Vue demo pages are Vue SFCs that back `<LiveDemo>` embeds in documentation pages. They are rendered in the Vue demo app via hash routes and referenced by docs using `demoPath` and `repoFiles`.

## File Location

| Category | Path template |
|----------|--------------|
| Example demos | `demos/vue/src/pages/examples/<feature>/<FeatureExamplePage>.vue` |
| Concept demos | `demos/vue/src/pages/concepts/<concept>/<ConceptFocusPage>.vue` |
| Guide demos | `demos/vue/src/pages/<guide>/<GuidePage>.vue` |

Use existing folder conventions in the target repo. If a dedicated folder already exists (for example `basic-usage/`), keep using it.

## File Naming Convention

**Vue SFC page files use `PascalCase` with a `Page` suffix** (e.g. `WorkspacesSwitchPage.vue`, `ToolsChangePage.vue`). This follows the official Vue Style Guide recommendation that single-file component filenames be PascalCase.

Folder names stay `kebab-case` (e.g. `workspaces/`, `context-menus/`). Non-component utility/helper files (e.g. `concept-shared.ts`, `seed-objects.ts`, `custom-vue-theme.ts`) stay `kebab-case` — PascalCase applies to SFC component files only.

## Routing Registration

Every Vue demo page must be registered in `demos/vue/src/router.ts`:

1. Import the page component.
2. Add a route entry in the router config.
3. Ensure the route path exactly matches the docs `demoPath`.

Without the route, the `<LiveDemo>` preview iframe will not load.

## Component Tag Rule

**Always use the PascalCase Vue component `<KritzelEditor>` (imported from `kritzel-vue`).** Never use the native web component tag `<kritzel-editor>` in Vue demo pages.

Reasons:
- The Vue wrapper registers the custom element lazily via `defineCustomElement`, ensuring tree-shaking and proper SSR compat.
- It enables typed props, Vue event handling (`@isReady`), and consistent component registration.
- It follows Vue single-file component conventions.

## Component Scaffold

```vue
<script setup lang="ts">

import {
  InMemorySyncProvider,
  KritzelEditor,
  getEditorRef,
  type KritzelSyncConfig,
} from 'kritzel-vue'
import { customVueTheme } from '../../const/custom-vue-theme'

// Resolve the native editor element from the template ref named "editor".
const editor = getEditorRef('editor')

const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    editorId="my-demo"
    :syncConfig="syncConfig"
    theme="vue-theme"
    :themes="[customVueTheme]"
    :loginConfig="undefined"
    :isPanningEnabled="false"
    :isZoomingEnabled="false"
    :isMoreMenuVisible="false"
    :isWorkspaceManagerVisible="false"
  />
</template>
```

## Framework Theming (REQUIRED by default)

Every Vue demo page should apply the Vue framework theme unless the docs explicitly require neutral/default rendering.

1. Import `customVueTheme` from `demos/vue/src/const/custom-vue-theme.ts`.
2. Bind `theme="vue-theme"` and `:themes="[customVueTheme]"`.

Only omit these bindings for intentionally neutral/theming-baseline demos.

## Required Editor Props

Every `<KritzelEditor>` in a Vue demo page should include:

| Prop | Purpose |
|------|---------|
| `ref=\"editor\"` | Template ref name passed to `getEditorRef('editor')` for programmatic access |
| `editorId="<unique-id>"` | Prevents state collision across demos |
| `:isPanningEnabled="false" :isZoomingEnabled="false"` | Prevents scroll-jacking in docs iframes |
| `:syncConfig="..."` | Explicit sync provider behavior |
| `:loginConfig="undefined"` | Disables login dialog in demos |
| `:isMoreMenuVisible="false"` | Hides more-menu unless required |
| `:isWorkspaceManagerVisible="false"` | Hides workspace manager unless required |
| `theme="vue-theme"` | Applies framework theme |
| `:themes="[customVueTheme]"` | Provides theme definition |

## Editor / Engine Ref Access (Vue-specific)

**In Vue you must resolve the native element through the `getEditorRef` / `getEngineRef` composables exported from `kritzel-vue`.** Do not type a raw `ref<HTMLKritzelEditorElement>` and expect it to point at the element.

Unlike Angular and React — where a template/element ref resolves directly to the native `HTMLKritzelEditorElement` (or `HTMLKritzelEngineElement`) out of the box — `<KritzelEditor>` and `<KritzelEngine>` are Vue components. A Vue template ref points at the **component instance proxy**, not the underlying custom element, so calling editor/engine methods on it directly is unreliable.

The composables unwrap the component instance's `$el` to the real custom element:

```ts
import { KritzelEditor, getEditorRef } from 'kritzel-vue'

// Pass the template ref NAME (string) — it must match `ref="..."` in the template.
const editor = getEditorRef('editor')
```

Then bind the matching ref in the template:

```html
<KritzelEditor ref="editor" ... @isReady="onReady" />
```

Now `editor.value?.addObject(...)` operates on the real `HTMLKritzelEditorElement`.

For the engine, use `getEngineRef` the same way:

```ts
import { getEngineRef } from 'kritzel-vue'

const engine = getEngineRef('engine') // matches `ref="engine"` in the template
```

> Both composables return a `computed` ref that resolves to the native element (or `null` until mounted). Always guard with optional chaining (`editor.value?.`).
>
> Reminder: this composable indirection is **Vue-only**. Angular (`viewChild`/`ElementRef`) and React (`useRef<HTMLKritzelEditorElement>`) resolve the native element directly without any helper.

## Seeding Objects

When a demo needs initial canvas content, use the shared helper (`seedEditor`) and call it inside the `@isReady` handler:

```ts
import { seedEditor } from '../shared/concept-shared'

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
```

The `seedEditor` helper accepts anything with an `addObject` method, which the ref satisfies directly.

Benefits:
- Consistent visuals across docs demos
- Less duplicate setup code
- Easier maintenance when shapes change

## LiveDemo Correspondence

`<LiveDemo>` in docs must point to the exact route and source file:

```jsx
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/vue"
  repoFiles={['src/pages/<folder>/<PageName>.vue']}
  demoPath="/<route>"
/>
```

Rules:
- `demoPath` must match the route in `demos/vue/src/router.ts` exactly.
- `repoFiles` paths must match the real file location and current folder layout.
- If files are moved (for example from `examples/` to `basic-usage/`), update docs immediately.

## Local Preview Reliability

For docs preview during local development:

1. Ensure Vue demo server is running on the expected port.
2. Ensure `website/docusaurus.config.ts` local `demoBaseUrls.vue` matches that port.
3. Verify `demoPath` resolves manually in browser (for example `http://localhost:5175/#/basic-usage`).

If any of these three are out of sync, the docs embed will appear broken even when page code exists.
