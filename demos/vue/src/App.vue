<script setup lang="ts">
import { KritzelEditor, KritzelPath } from 'kritzel-vue'

let editor: HTMLKritzelEditorElement;

async function onIsReady(event: CustomEvent<HTMLKritzelEditorElement>) {
  editor = event.detail;

  const path = new KritzelPath({
    points: [[0, 0], [100, 100]],
    translateX: 0,
    translateY: 0
  });

  editor.addObject(path);
  editor.centerObjectInViewport(path);
  editor.selectAllObjectsInViewport();
}

</script>

<template>
  <main>
    <KritzelEditor ref="editor" v-on:is-ready="onIsReady" />
  </main>
</template>

<style scoped></style>
