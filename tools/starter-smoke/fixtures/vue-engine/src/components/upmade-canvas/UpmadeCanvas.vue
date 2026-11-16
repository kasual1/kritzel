<script setup lang="ts">
import { ref } from 'vue';
import {
  getEngineRef,
  UpmadeBrushTool,
  UpmadeEngine,
  UpmadeEraserTool,
  UpmadeSelectionTool,
} from '@upmade/vue-engine';

const editorId = 'upmade-canvas';
const engine = getEngineRef('upmadeEngine');
const initializationError = ref('');
let initializationStarted = false;

async function onEngineReady(): Promise<void> {
  if (initializationStarted) return;
  initializationStarted = true;

  const instance = engine.value;
  if (!instance) {
    initializationError.value = 'The Upmade engine element is not available.';
    return;
  }

  try {
    if (!(await instance.registerTool('selection', UpmadeSelectionTool))) {
      throw new Error('Upmade could not register the selection tool.');
    }
    if (!(await instance.registerTool('brush', UpmadeBrushTool))) {
      throw new Error('Upmade could not register the brush tool.');
    }
    if (!(await instance.registerTool('eraser', UpmadeEraserTool))) {
      throw new Error('Upmade could not register the eraser tool.');
    }
    await instance.setActiveTool('brush');
  } catch (error: unknown) {
    initializationError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section>
    <UpmadeEngine
      ref="upmadeEngine"
      :editorId="editorId"
      @isEngineReady="onEngineReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Upmade canvas"
    />
    <p v-if="initializationError" role="alert">{{ initializationError }}</p>
  </section>
</template>
