<script setup lang="ts">
import { KritzelEditor, KritzelImage } from 'kritzel-vue'

let editor: HTMLKritzelEditorElement;

async function onIsReady(event: CustomEvent<HTMLKritzelEditorElement>) {
  editor = event.detail;

  const img = new Image();
  img.src = "https://placehold.co/600x400";

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const image = new KritzelImage({
    src: img.src,
    x: 0,
    y: 0,
    translateX: 0,
    translateY: 0,
  });

  const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
  image.width = scaledWidth;
  image.height = scaledHeight;

  editor.addObject(image);
  editor.centerObjectInViewport(image);
  editor.selectAllObjectsInViewport();
}

</script>

<template>
  <main>
    <KritzelEditor ref="editor" v-on:is-ready="onIsReady" />
  </main>
</template>

<style scoped></style>
