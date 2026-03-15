---
sidebar_label: Basic Usage
displayed_sidebar: tutorialSidebar
---

# Basic Usage

Once you have `<kritzel-editor>` rendering in your application, you can start interacting with the canvas programmatically.

## Accessing the Editor Instance

To interact with the editor, use a `ref` on the `<kritzel-editor>` component to access the instance. Note that most API methods are asynchronous and return Promises.

```vue
<template>
  <kritzel-editor ref="editorRef" @isReady="onReady"></kritzel-editor>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const editorRef = ref<HTMLKritzelEditorElement | null>(null);

const onReady = (event: CustomEvent<HTMLKritzelEditorElement>) => {
  console.log("Editor is ready:", event.detail);
};
</script>
```

## Changing Tools

You can programmatically change the active drawing tool currently used by the canvas.

```vue
<template>
  <div class="toolbar">
    <button @click="setBrushTool">Brush</button>
    <button @click="setSelectTool">Select</button>
  </div>
  <kritzel-editor ref="editorRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue';

const editorRef = ref<HTMLKritzelEditorElement | null>(null);

const setBrushTool = async () => {
  if (editorRef.value) {
    await editorRef.value.setActiveTool('brush');
  }
};

const setSelectTool = async () => {
  if (editorRef.value) {
    await editorRef.value.setActiveTool('select');
  }
};
</script>
```

## Listening to Events

Using the `@` syntax in Vue, you can bind event listeners to stay updated about changes happening inside the canvas.

```vue
<template>
  <kritzel-editor 
    @objectsChange="onObjectsChange"
    @viewportChange="onViewportChange"
  ></kritzel-editor>
</template>

<script setup lang="ts">
const onObjectsChange = (event: CustomEvent) => {
  console.log("Canvas objects have changed:", event.detail);
};

const onViewportChange = (event: CustomEvent) => {
  console.log("Viewport updated:", event.detail);
};
</script>
```

## Calling Methods

You can use the template `editorRef` to call component methods.

```vue
<script setup lang="ts">
const zoomIn = async () => {
  if (editorRef.value) {
    await editorRef.value.zoomTo(1.5);
  }
};

const undoAction = async () => {
  if (editorRef.value) {
    await editorRef.value.undo();
  }
};
</script>
```

## Adding and Modifying Objects

You can add objects to the canvas programmatically using the provided classes such as `KritzelText`, `KritzelPath`, or `KritzelShape`.

```ts
import { KritzelText } from "kritzel-vue";

const addText = async () => {
  if (editorRef.value) {
    const text = new KritzelText({
      value: "Programmatic text!",
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: "Arial",
      fontColor: "#ff0000"
    });

    await editorRef.value.addObject(text);
    await editorRef.value.centerObjectInViewport(text);
    await editorRef.value.selectObjects([text]); // Automatically select it
  }
};
```
