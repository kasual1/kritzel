<script setup lang="ts">
import { ref } from 'vue'
import { getEngineRef, KritzelEngine, type HTMLKritzelEngineElement } from '@kritzel/vue-engine'
import { createSeedObjects } from '../../getting-started/seed-objects'

const engine = getEngineRef('engine')
const jsonInput = ref('')
const activeWorkspaceName = ref('')

// seed a workspace and pre-fill the textarea with a valid, importable JSON sample
async function onReady(): Promise<void> {
  const engineValue = engine.value as HTMLKritzelEngineElement | undefined
  if (!engineValue) {
    return
  }

  for (const obj of createSeedObjects()) {
    await engineValue.addObject(obj)
  }

  jsonInput.value = await engineValue.exportAsJson()
  activeWorkspaceName.value = (await engineValue.getActiveWorkspace())?.name ?? ''
}

async function importJson(): Promise<void> {
  const engineValue = engine.value as HTMLKritzelEngineElement | undefined
  if (!engineValue) {
    return
  }

  await engineValue.importFromJson(jsonInput.value)
  activeWorkspaceName.value = (await engineValue.getActiveWorkspace())?.name ?? ''
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <span class="label">Workspace Import</span>
      <span class="status">Active workspace: {{ activeWorkspaceName }}</span>
    </div>
    <div class="content">
      <KritzelEngine
        ref="engine"
        editorId="import-export-workspace-import"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        @isEngineReady="onReady"
        style="flex: 1 1 60%; min-height: 0; display: block"
      />
      <div class="import-panel">
        <textarea class="json-input" v-model="jsonInput" spellcheck="false"></textarea>
        <button @click="importJson">Import Workspace</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
.label { font-weight: 700; font-size: 13px; color: #42b883; margin-right: 4px; }
.status { font-size: 12px; color: #555; }
.content { flex: 1; display: flex; min-height: 0; }
.import-panel { flex: 1 1 40%; display: flex; flex-direction: column; gap: 8px; padding: 12px; border-left: 1px solid #e0e0e0; }
.json-input { flex: 1; resize: none; font-size: 11px; line-height: 1.4; padding: 8px; box-sizing: border-box; }
.import-panel button { align-self: flex-start; }
</style>
