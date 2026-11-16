<script setup lang="ts">
import { ref } from 'vue';
import { UpmadeEditor } from '@upmade/vue-editor';

const editorId = 'upmade-canvas';
const isReady = ref(false);

function onReady(): void {
  isReady.value = true;
}
</script>

<template>
  <section>
    <UpmadeEditor
      :editorId="editorId"
      @isReady="onReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Upmade canvas"
    />
    <p role="status">{{ isReady ? 'Upmade is ready.' : 'Loading Upmade…' }}</p>
  </section>
</template>
