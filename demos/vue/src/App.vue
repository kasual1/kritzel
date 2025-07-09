<script setup lang="ts">
import { KritzelEditor, KritzelText } from 'kritzel-vue'

let editor: HTMLKritzelEditorElement;

async function getSelectedObjects() {
   editor.selectAllObjectsInViewport();
}

async function onIsReady(event: CustomEvent<HTMLKritzelEditorElement>) {
  editor = event.detail;

  const text = new KritzelText({
    value: 'Hello Kritzel!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: '#000000',
    height: 200,
    width: 200,
  });

  await editor.addObject(text);
  editor.selectObjects([text]);
}

</script>

<template>
  <main>
    <div style="display: flex; gap: 10px; position: absolute; top: 0; left: 0; z-index: 100;">
      <button @click="getSelectedObjects">Get selected objects</button>
    </div>

    <KritzelEditor ref="editor" v-on:is-ready="onIsReady" />
  </main>
</template>

<style scoped></style>
