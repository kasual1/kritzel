---
sidebar_label: Quick Start
title: "Quick Start | Kritzel for Angular"
description: "Install and integrate the Kritzel infinite canvas into your Angular application in minutes."
keywords:
  - angular whiteboard
  - angular infinite canvas
  - kritzel
toc_max_heading_level: 2
---

import LiveDemo from '@site/src/components/LiveDemo';
import SkillInstallation from '@site/src/components/SkillInstallation';

# Quick Start

The following guide gets you a full Kritzel editor setup in under five minutes.

## Installation

Run the following command to install the Kritzel editor in your project.

```bash
npm install @kritzel/angular-editor
```

<SkillInstallation>

Install the related Kritzel skill for coding assistance:

```bash
npx skills add kasual1/kritzel
```

</SkillInstallation>

## Setup

Register Kritzel in your application config:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideKritzel } from '@kritzel/angular-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideKritzel(),
  ],
};
```

Then use the `<kritzel-editor>` component in your template:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  template: `<kritzel-editor></kritzel-editor>`,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {}
```

This renders the editor with all the default ui elements such as the toolbar, the workspace manager, the more menu and the zoom control panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/angular"
  demoPath="/getting-started/quick-start"
  repoFiles={['src/app/pages/getting-started/quick-start.component.ts']}
/>

## Optional Enhancements

### Persisting Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, take a look at [Persistence](../fundamentals/persistence.md).

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { IndexedDBSyncProvider, KritzelEditor, KritzelSyncConfig } from '@kritzel/angular-editor';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  template: `<kritzel-editor [syncConfig]="syncConfig"></kritzel-editor>`,
  styles: [`kritzel-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  readonly syncConfig: KritzelSyncConfig = {
    providers: [IndexedDBSyncProvider],
  };
}
```

### Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g., `styles.css`):

```css
html,
body,
app-root {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: block;
}
```

### Mobile Viewport Meta Tag

For optimal rendering and responsiveness on mobile devices, add this meta tag within the `<head>` section of your `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Angular App</title>
    <base href="/">
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```
