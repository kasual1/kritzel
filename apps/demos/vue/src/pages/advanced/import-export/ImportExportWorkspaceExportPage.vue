<script setup lang="ts">
import { ref } from 'vue'
import { getEngineRef, KritzelEngine, type HTMLKritzelEngineElement } from '@kritzel/vue-engine'
import { createSeedObjects } from '../../getting-started/seed-objects'

const engine = getEngineRef('engine')
const jsonPreview = ref('Click "Preview as JSON" to see the exported workspace.')

async function onReady(): Promise<void> {
  const engineValue = engine.value as HTMLKritzelEngineElement | undefined
  if (!engineValue) {
    return
  }

  for (const obj of createSeedObjects()) {
    await engineValue.addObject(obj)
  }
}

async function previewJson(): Promise<void> {
  const engineValue = engine.value as HTMLKritzelEngineElement | undefined
  jsonPreview.value = (await engineValue?.exportAsJson()) ?? ''
}

async function downloadJson(): Promise<void> {
  await (engine.value as HTMLKritzelEngineElement | undefined)?.downloadAsJson()
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <span class="label">Workspace Export</span>
      <button @click="previewJson">Preview as JSON</button>
      <button @click="downloadJson">Download JSON</button>
    </div>
    <div class="content">
      <KritzelEngine
        ref="engine"
        editorId="import-export-workspace-export"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        @isEngineReady="onReady"
        style="flex: 1 1 60%; min-height: 0; display: block"
      />
      <pre class="json-preview">{{ jsonPreview }}</pre>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
.label { font-weight: 700; font-size: 13px; color: #42b883; margin-right: 4px; }
.content { flex: 1; display: flex; min-height: 0; }
.json-preview { flex: 1 1 40%; margin: 0; padding: 12px; overflow: auto; font-size: 11px; line-height: 1.4; background: #1e1e1e; color: #d4d4d4; border-left: 1px solid #e0e0e0; }
</style>
