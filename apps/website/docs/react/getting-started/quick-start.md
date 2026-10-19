---
sidebar_label: Quick Start
title: "Quick Start | Kritzel for React"
description: "Install and integrate the Kritzel infinite canvas into your React application in minutes."
keywords:
  - react whiteboard
  - react infinite canvas
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
npm install @kritzel/react-editor
```

<SkillInstallation>

Install the related Kritzel skill for coding assistance:

```bash
npx skills add kasual1/kritzel
```

</SkillInstallation>

## Setup

Import and render the `<KritzelEditor>` component:

```tsx title="Editor.tsx"
import { KritzelEditor } from '@kritzel/react-editor';

export function Editor() {
  return <KritzelEditor style={{ display: 'block', width: '100%', height: '100vh' }} />;
}
```

This renders the editor with all the default UI elements such as the toolbar, the workspace manager, the more menu, and the zoom control panel.

<LiveDemo
  repoUrl="https://github.com/kasual1/kritzel/tree/main/apps/demos/react"
  demoPath="/getting-started/quick-start"
  repoFiles={['src/pages/getting-started/QuickStartPage.tsx']}
/>

## Optional Enhancements

### Persisting Canvas State

By default, the editor uses an empty sync provider list, so canvas state is reset on reload. To persist objects locally across page reloads, configure `syncConfig` explicitly with `IndexedDBSyncProvider`.

For provider behavior details and persistence guidance, take a look at [Persistence](../fundamentals/persistence.md).

```tsx title="Editor.tsx"
import { IndexedDBSyncProvider, KritzelEditor, type KritzelSyncConfig } from '@kritzel/react-editor';

const syncConfig: KritzelSyncConfig = {
  providers: [IndexedDBSyncProvider],
};

export function Editor() {
  return (
    <KritzelEditor
      syncConfig={syncConfig}
      style={{ display: 'block', width: '100%', height: '100vh' }}
    />
  );
}
```

### Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g., `styles.css`):

```css
html,
body,
#root {
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
    <title>React App</title>
    <base href="/">
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```