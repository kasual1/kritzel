---
sidebar_label: Quick Start
title: "Quick Start | Kritzel for Angular"
description: "Install and integrate the Kritzel infinite canvas into your Angular application in minutes."
keywords:
  - angular whiteboard
  - angular infinite canvas
  - kritzel
---

import LiveDemo from '@site/src/components/LiveDemo';

# Quick Start

The following guide gets you a full Kritzel editor setup in under five minutes.

## Installation

Run the following command to install Kritzel and add it to your package.json.

```bash
npm install kritzel-angular
```

## Setup

Register Kritzel in your application config:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideKritzel } from 'kritzel-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideKritzel(),
  ],
};
```

Then use the component in your template:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

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
  repoUrl="https://github.com/kasual1/kritzel-demos/tree/main/angular"
  demoPath="/getting-started/quick-start"
  repoFiles={['src/app/getting-started/quick-start.component.ts']}
/>

## Optional Enhancements

### Persist Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, take a look at [Persistence](../fundamentals/persistence.md).

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { IndexedDBSyncProvider, KritzelEditor, KritzelSyncConfig } from 'kritzel-angular';

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

### Apply Full Viewport Styling

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

### Include Mobile Viewport Meta Tag

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
