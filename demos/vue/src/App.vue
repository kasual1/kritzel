<script setup lang="ts">
import { KritzelEditor, KritzelText } from 'kritzel-vue'

let editor: HTMLKritzelEditorElement;

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

  editor.addObject(text);
  editor.centerObjectInViewport(text);
  editor.selectObjects([text]);
}

</script>

<template>
  <main>
    <KritzelEditor ref="editor" v-on:is-ready="onIsReady" />
  </main>
</template>

<style scoped></style>
