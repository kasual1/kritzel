# Getting Started

This guide shows how to quickly add Kritzel to your project.

A full working example is available [here](https://stackblitz.com/edit/vitejs-vite-aqewrbmu?file=src%2FApp.tsx).

## Installation

First, install the Kritzel React package:

```bash
npm install kritzel-react
```

## Setup

Follow these steps to set up KritzelEditor in your React project.

### Adjust Your App Component

Edit your `App.tsx` as follows:

```tsx
import "./App.css";
import { KritzelEditor, KritzelText } from "kritzel-react";

function App() {
  let editor: HTMLKritzelEditorElement | null = null;

  async function onIsReady(
    event: CustomEvent<HTMLKritzelEditorElement>
  ): Promise<void> {
    editor = event.detail;

    const text = new KritzelText({
      value: "Hello Kritzel!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#000000",
      height: 200,
      width: 200,
    });

    editor.addObject(text);
    editor.centerObjectInViewport(text);
    editor.selectObjects([text]);
  }

  return (
    <div className="app">
      <KritzelEditor onIsReady={onIsReady}></KritzelEditor>
    </div>
  );
}

export default App;
```

---

## Optional Enhancements

### Apply Full Viewport Styling

To ensure the Kritzel editor occupies the entire viewport and prevents unwanted scrolling, add the following CSS to your global stylesheet (e.g., `App.css`):

```css
html,
body,
#root,
.app {
  width: 100dvw;
  height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

### Include Mobile Viewport Meta Tag

For optimal rendering and responsiveness on mobile devices, add this meta tag within the `<head>` section of your `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0, interactive-widget=resizes-content" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
