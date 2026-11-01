<script setup lang="ts">
import { ref } from 'vue';
import {
  getEngineRef,
  KritzelBrushTool,
  KritzelEngine,
  KritzelEraserTool,
  KritzelSelectionTool,
} from '@kritzel/vue-engine';

const editorId = 'kritzel-canvas';
const engine = getEngineRef('kritzelEngine');
const initializationError = ref('');
let initializationStarted = false;

async function onEngineReady(): Promise<void> {
  if (initializationStarted) return;
  initializationStarted = true;

  const instance = engine.value;
  if (!instance) {
    initializationError.value = 'The Kritzel engine element is not available.';
    return;
  }

  try {
    if (!(await instance.registerTool('selection', KritzelSelectionTool))) {
      throw new Error('Kritzel could not register the selection tool.');
    }
    if (!(await instance.registerTool('brush', KritzelBrushTool))) {
      throw new Error('Kritzel could not register the brush tool.');
    }
    if (!(await instance.registerTool('eraser', KritzelEraserTool))) {
      throw new Error('Kritzel could not register the eraser tool.');
    }
    await instance.setActiveTool('brush');
  } catch (error: unknown) {
    initializationError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section>
    <KritzelEngine
      ref="kritzelEngine"
      :editorId="editorId"
      @isEngineReady="onEngineReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Kritzel canvas"
    />
    <p v-if="initializationError" role="alert">{{ initializationError }}</p>
  </section>
</template>
