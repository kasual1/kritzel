---
title: "Quick Start | Kritzel for Angular"
description: "Install and integrate the Kritzel infinite canvas into your Angular application in minutes."
---
# Quick Start

## Installation

```bash
npm install kritzel-angular
```

## Setup

Register the Angular module in your app:

```ts
// app.module.ts
import { KritzelAngularModule } from 'kritzel-angular';

@NgModule({
  imports: [KritzelAngularModule],
})
export class AppModule {}
```

Then use the component in your template:

```html
<!-- app.component.html -->
<kritzel-editor></kritzel-editor>
```

## Optional Enhancements

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
