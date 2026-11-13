<script setup lang="ts">
import { ref } from 'vue';
import {
  getEngineRef,
  UpdrawBrushTool,
  UpdrawEngine,
  UpdrawEraserTool,
  UpdrawSelectionTool,
} from '@updraw/vue-engine';

const editorId = 'updraw-canvas';
const engine = getEngineRef('updrawEngine');
const initializationError = ref('');
let initializationStarted = false;

async function onEngineReady(): Promise<void> {
  if (initializationStarted) return;
  initializationStarted = true;

  const instance = engine.value;
  if (!instance) {
    initializationError.value = 'The Updraw engine element is not available.';
    return;
  }

  try {
    if (!(await instance.registerTool('selection', UpdrawSelectionTool))) {
      throw new Error('Updraw could not register the selection tool.');
    }
    if (!(await instance.registerTool('brush', UpdrawBrushTool))) {
      throw new Error('Updraw could not register the brush tool.');
    }
    if (!(await instance.registerTool('eraser', UpdrawEraserTool))) {
      throw new Error('Updraw could not register the eraser tool.');
    }
    await instance.setActiveTool('brush');
  } catch (error: unknown) {
    initializationError.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <section>
    <UpdrawEngine
      ref="updrawEngine"
      :editorId="editorId"
      @isEngineReady="onEngineReady"
      style="display: block; width: 100%; height: 480px"
      aria-label="Updraw canvas"
    />
    <p v-if="initializationError" role="alert">{{ initializationError }}</p>
  </section>
</template>
