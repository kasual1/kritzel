<script setup lang="ts">

import {
  KritzelBrushTool,
  KritzelEraserTool,
  KritzelSelectionTool,
} from 'kritzel-vue'
import { buttonStyle, hostStyle, toolbarStyle } from '../shared/concept-shared'
import { createSeedObjects } from '../../basic-usage/seed-objects'
import { ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const engine = ref<any>(null)

async function withEngine(action: (engine: any) => Promise<void>) {
  if (engine.value) {
    await action(engine.value)
  }
}

async function onReady() {
  if (!engine.value) {
    return
  }

  // The engine does not register any tools by default — you must register them manually.
  await engine.value.registerTool('brush', KritzelBrushTool)
  await engine.value.registerTool('eraser', KritzelEraserTool)
  await engine.value.registerTool('select', KritzelSelectionTool)

  for (const obj of createSeedObjects()) {
    await engine.value.addObject(obj)
  }

  await engine.value.changeActiveToolByName('brush')
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="withEngine((e) => e.changeActiveToolByName('brush'))">Brush</button>
      <button :style="buttonStyle(false)" @click="withEngine((e) => e.changeActiveToolByName('eraser'))">Eraser</button>
      <button :style="buttonStyle(false)" @click="withEngine((e) => e.changeActiveToolByName('select'))">Select</button>
      <button :style="buttonStyle(false)" @click="withEngine((e) => e.undo())">Undo</button>
      <button :style="buttonStyle(false)" @click="withEngine((e) => e.redo())">Redo</button>
    </div>
    <kritzel-engine
      ref="engine"
      editorId="components-engine"
      :wheelEnabled="false"
      :style="{ flex: 1, minHeight: 0, display: 'block' }"
      @isEngineReady="onReady"
    />
  </div>
</template>
