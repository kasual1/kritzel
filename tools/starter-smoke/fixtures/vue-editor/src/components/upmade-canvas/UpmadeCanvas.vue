<script setup lang="ts">
import { ref } from 'vue';
import { UpdrawEditor } from '@updraw/vue-editor';

const editorId = 'updraw-canvas';
const isReady = ref(false);

function onReady(): void {
  isReady.value = true;
}
</script>

<template>
  <section>
    <UpdrawEditor
      :editorId="editorId"
      @isReady="onReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Updraw canvas"
    />
    <p role="status">{{ isReady ? 'Updraw is ready.' : 'Loading Updraw…' }}</p>
  </section>
</template>
