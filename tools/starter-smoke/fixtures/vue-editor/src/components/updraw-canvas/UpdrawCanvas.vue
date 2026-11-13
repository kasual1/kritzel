<script setup lang="ts">
import { ref } from 'vue';
import { KritzelEditor } from '@kritzel/vue-editor';

const editorId = 'kritzel-canvas';
const isReady = ref(false);

function onReady(): void {
  isReady.value = true;
}
</script>

<template>
  <section>
    <KritzelEditor
      :editorId="editorId"
      @isReady="onReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Kritzel canvas"
    />
    <p role="status">{{ isReady ? 'Kritzel is ready.' : 'Loading Kritzel…' }}</p>
  </section>
</template>
