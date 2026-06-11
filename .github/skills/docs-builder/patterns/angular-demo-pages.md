# Pattern: Angular Demo Pages

## Overview

Angular demo pages are the standalone Angular components that back `<LiveDemo>` embeds in the documentation. Each documentation `.md` file references one or more demo pages via the `<LiveDemo>` component's `iframeUrl` and `repoFiles` props. The demo pages live in the Angular demo app and are served via hash-routing on GitHub Pages.

## File Location

| Category | Path template |
|----------|--------------|
| Example demos | `demos/angular/src/app/examples/<feature>/<feature>-<example-name>.component.ts` |
| Concept demos | `demos/angular/src/app/concepts/<concept>/<concept>-<focus>.component.ts` |

## File Naming Convention

**Angular component files use `kebab-case` with a `.component.ts` suffix** (e.g. `workspaces-switch.component.ts`, `tools-change.component.ts`), following the Angular style guide. This differs from React (`PascalCase` `.tsx`) and Vue (`PascalCase` `.vue`), which use PascalCase for component files. When porting between frameworks, convert filenames accordingly:

| Framework | Example filename |
|-----------|-----------------|
| Angular | `workspaces-switch.component.ts` (kebab-case) |
| React | `WorkspacesSwitchPage.tsx` (PascalCase) |
| Vue | `WorkspacesSwitchPage.vue` (PascalCase) |

## Routing Registration

Every demo component **must** be registered in `demos/angular/src/app/app.routes.ts`:

1. Import the component at the top of the file.
2. Add a route entry inside the appropriate `children` array (`concepts` or `examples`).

```typescript
// Import
import { ComponentsEditorComponent } from './concepts/components/components-editor.component';

// Route
{ path: 'concepts', children: [
  { path: 'components-editor', component: ComponentsEditorComponent },
]}
```

Without the route, the `<LiveDemo>` iframe will 404.

## Component Scaffold

All demo components follow this base structure:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { KritzelEditor, InMemorySyncProvider, KritzelSyncConfig } from 'kritzel-angular';
import { customAngularTheme } from '../../const/custom-angular-theme';

@Component({
  selector: 'app-<category>-<name>',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="<category>-<name>"
      [wheelEnabled]="false"
      [theme]="'angular-theme'"
      [themes]="themes"
      [loginConfig]="undefined"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class MyDemoComponent {
  themes = [customAngularTheme];
}
```

## Framework Theming (REQUIRED by default)

**Every demo component must apply the Angular framework theme** unless the documentation explicitly requires neutral/unthemed rendering (e.g., a concept page demonstrating theming itself where neutral state is needed for contrast).

To apply the theme:

1. Import `customAngularTheme` from `'../../const/custom-angular-theme'` (adjust relative path based on file depth).
2. Set `themes = [customAngularTheme]` on the component class.
3. Bind `[theme]="'angular-theme'"` and `[themes]="themes"` on the `<kritzel-editor>` element.

```typescript
import { customAngularTheme } from '../../const/custom-angular-theme';

// In component class:
themes = [customAngularTheme];
```

```html
<kritzel-editor
  [theme]="'angular-theme'"
  [themes]="themes"
  ...
></kritzel-editor>
```

### When to skip theming

Only omit the framework theme when the docs page **explicitly** states that neutral/default appearance is needed — for example:
- A "Theming" concept page that intentionally shows the default light/dark themes before demonstrating customization.
- A page demonstrating theme switching where the initial state should be the built-in default.

In those cases, omit `[theme]` and `[themes]` bindings entirely, and do not import `customAngularTheme`.

## Required Bindings

Every `<kritzel-editor>` in a demo page must include these bindings:

| Binding | Purpose |
|---------|---------|
| `editorId="<unique-id>"` | Unique identifier per demo (prevents state collision) |
| `[wheelEnabled]="false"` | Prevents scroll-jacking inside iframes |
| `[syncConfig]="syncConfig"` | Configures sync providers (use `empty array` as to disable) |
| `[loginConfig]="undefined"` | Disables the login dialog |
| `[isMoreMenuVisible]="false"` | Hides the more menu (unless the demo needs it) |
| `[isWorkspaceManagerVisible]="false"` | Hides workspace manager (unless the demo needs it) |
| `[theme]="'angular-theme'"` | Applies framework theme (unless explicitly neutral) |
| `[themes]="themes"` | Provides theme definitions (unless explicitly neutral) |

## Component Rules

1. **Standalone only** — never use NgModules. Do not set `standalone: true` (it's the default).
2. **OnPush change detection** — always set `changeDetection: ChangeDetectionStrategy.OnPush`.
3. **Self-contained** — each component must work independently; no shared services or external state.
4. **Minimal** — include only what's needed to demonstrate the documented feature.
5. **No `@HostBinding` / `@HostListener`** — use `host` metadata in the decorator instead.
6. **Native control flow** — use `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`).
7. **Signals** — prefer `signal()`, `computed()`, and `input()`/`output()` over decorators.

## Using the Engine Component

When a demo needs the headless `<kritzel-engine>` (no built-in UI), use `CUSTOM_ELEMENTS_SCHEMA` since there is no Angular proxy directive for the engine:

```typescript
import { Component, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, viewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-my-engine-demo',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-engine #engine (isReady)="onReady()"></kritzel-engine>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class MyEngineDemoComponent {
  engineRef = viewChild<ElementRef<HTMLElement>>('engine');

  private get engine(): any {
    return this.engineRef()?.nativeElement;
  }

  async onReady() {
    // Engine API calls go here
  }
}
```

> **Editor / engine ref access is direct in Angular** — a `viewChild`/`ElementRef` (or the `KritzelEditor` directive instance) resolves to the native `HTMLKritzelEditorElement` / `HTMLKritzelEngineElement` out of the box, so `this.editor.addObject(...)` works without any helper. This differs from Vue, which requires the `getEditorRef` / `getEngineRef` composables from `kritzel-vue` to unwrap the component instance to the underlying element.

## Seeding Objects with `createSeedObjects()`

When a demo needs pre-existing objects on the canvas (e.g., to demonstrate selection, viewport navigation, querying, grouping, or any feature that operates on objects), use the shared `createSeedObjects()` helper from `demos/angular/src/app/const/seed-objects.ts`. This ensures **visual consistency** across all demo pages — users see the same recognizable set of shapes, paths, and lines everywhere.

### Usage

```typescript
import { createSeedObjects } from '../../const/seed-objects';

// Inside the component, typically in an onReady handler:
async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
  for (const obj of createSeedObjects()) {
    await this.editor.addObject(obj);
  }
}
```

Adjust the relative import path based on the component's depth within the `app/` directory.

### When to use seed objects

- The demo needs objects already present on the canvas to demonstrate a feature (viewport centering, object querying, selection, z-ordering, etc.).
- The demo would otherwise create ad-hoc shapes solely to have something visible — replace those with `createSeedObjects()`.

### When NOT to use seed objects

- The demo's purpose is to show the user **how to create objects** (e.g., an "Add/Remove Objects" concept page) — in that case, user-driven creation is the point.
- The demo requires specific object configurations that differ meaningfully from the seed set (custom sizes, positions, or properties that serve the narrative).
- The demo intentionally starts with an empty canvas.

### Benefits

- Consistent visuals across docs pages — readers recognize the same shapes.
- Reduces duplicated object-creation boilerplate in each component.
- Changes to seed objects propagate to all demos automatically.

## Custom UI Styling

When the demo includes custom UI (toolbars, panels, buttons) alongside the editor:

- Set `font-family: Roboto, sans-serif` on `:host`.
- Use Angular theme colors for active/selected states:
  - Primary: `#dd0031`
  - Primary hover: `#b30027`
  - Text: `#333333`
  - Border: `#ebebeb`
- Active buttons: primary background with white text.
- Use `display: flex; flex-direction: column; height: 100%` for layouts with toolbar + editor.

## LiveDemo Correspondence

The `<LiveDemo>` in the docs `.md` file must point to the correct route and file:

```jsx
// For example demos:
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/examples/<feature>-<example-name>"
  repoFiles={['src/app/examples/<feature>/<feature>-<example-name>.component.ts']}
/>

// For concept demos:
<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  iframeUrl="https://kasual1.github.io/kritzel-demos/angular/#/concepts/<concept>-<focus>"
  repoFiles={['src/app/concepts/<concept>/<concept>-<focus>.component.ts']}
/>
```

The route path in `iframeUrl` must exactly match the `path` registered in `app.routes.ts`.
