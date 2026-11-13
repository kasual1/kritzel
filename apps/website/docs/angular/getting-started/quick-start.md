---
sidebar_label: Quick Start
title: "Quick Start | Updraw for Angular"
description: "Install and integrate the Updraw infinite canvas into your Angular application in minutes."
keywords:
  - angular whiteboard
  - angular infinite canvas
  - updraw
toc_max_heading_level: 2
---

import LiveDemo from '@site/src/components/LiveDemo';
import SkillInstallation from '@site/src/components/SkillInstallation';

# Quick Start

The following guide gets you a full Updraw editor setup in under five minutes.

## Installation

Run the following command to install the Updraw editor in your project.

```bash
npm install @updraw/angular-editor
```

<SkillInstallation>

Install the related Updraw skill for coding assistance:

```bash
npx skills add kasual1/kritzel
```

</SkillInstallation>

## Setup

Register Updraw in your application config:

```ts title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideUpdraw } from '@updraw/angular-editor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideUpdraw(),
  ],
};
```

Then use the `<updraw-editor>` component in your template:

```ts title="editor.component.ts"
import { Component } from '@angular/core';
import { UpdrawEditor } from '@updraw/angular-editor';

@Component({
  selector: 'app-editor',
  imports: [UpdrawEditor],
  template: `<updraw-editor></updraw-editor>`,
  styles: [`updraw-editor { display: block; width: 100%; height: 100vh; }`],
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
import { IndexedDBSyncProvider, UpdrawEditor, UpdrawSyncConfig } from '@updraw/angular-editor';

@Component({
  selector: 'app-editor',
  imports: [UpdrawEditor],
  template: `<updraw-editor [syncConfig]="syncConfig"></updraw-editor>`,
  styles: [`updraw-editor { display: block; width: 100%; height: 100vh; }`],
})
export class EditorComponent {
  readonly syncConfig: UpdrawSyncConfig = {
    providers: [IndexedDBSyncProvider],
  };
}
```

### Full Viewport Styling

To ensure the Updraw editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g., `styles.css`):

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
