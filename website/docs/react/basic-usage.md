---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
---

# Basic Usage

Once you have `<KritzelEditor />` rendering in your application, you can start interacting with the canvas programmatically.

## Accessing the Editor Instance

To interact with the editor, use the `onIsReady` event to access the `HTMLKritzelEditorElement` instance. Note that most API methods are asynchronous and return Promises.

```tsx
import { useState } from "react";
import { KritzelEditor } from "kritzel-react";

function App() {
  const [editor, setEditor] = useState<HTMLKritzelEditorElement | null>(null);

  const onIsReady = (event: CustomEvent<HTMLKritzelEditorElement>) => {
    setEditor(event.detail);
  };

  return <KritzelEditor onIsReady={onIsReady} />;
}
```

## Changing Tools

You can programmatically change the active drawing tool currently used by the canvas.

```tsx
const setBrushTool = async () => {
  if (editor) {
    await editor.setActiveTool('brush');
  }
};

const setSelectTool = async () => {
  if (editor) {
    await editor.setActiveTool('select');
  }
};
```

## Listening to Events

The Kritzel component emits several events to help you stay updated about changes happening inside the canvas.

```tsx
function App() {
  const onObjectsChange = (event: CustomEvent) => {
    console.log("Canvas objects have changed:", event.detail);
  };

  const onViewportChange = (event: CustomEvent) => {
    console.log("Viewport updated:", event.detail);
  };

  return (
    <KritzelEditor 
      onIsReady={onIsReady} 
      onObjectsChange={onObjectsChange}
      onViewportChange={onViewportChange}
    />
  );
}
```

## Calling Methods

You can call methods directly on the editor instance object. All methods are async and return Promises:

```tsx
const zoomIn = async () => {
  if (editor) {
    await editor.zoomTo(1.5);
  }
};

const undoAction = async () => {
  if (editor) {
    await editor.undo();
  }
};
```

## Adding and Modifying Objects

You can add objects to the canvas programmatically using the provided classes such as `KritzelText`, `KritzelPath`, or `KritzelShape`.

```tsx
import { KritzelText } from "kritzel-react";

const addText = async () => {
  if (editor) {
    const text = new KritzelText({
      value: "Programmatic text!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#ff0000"
    });

    await editor.addObject(text);
    await editor.centerObjectInViewport(text);
    await editor.selectObjects([text]); // Automatically select it
  }
};
```
