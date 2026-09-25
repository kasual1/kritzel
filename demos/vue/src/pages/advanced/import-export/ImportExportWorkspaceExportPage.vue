<script setup lang="ts">
import { ref } from 'vue'
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'

const editor = getEditorRef('editor')
const jsonPreview = ref('Click "Preview as JSON" to see the exported workspace.')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [
  new KritzelWorkspace({
    id: 'workspace-export',
    name: 'Workspace Export',
    objects: createSeedObjects(),
  }),
]

async function previewJson(): Promise<void> {
  const json = await editor.value?.exportAsJson()
  if (json) {
    jsonPreview.value = json
  }
}

async function downloadJson(): Promise<void> {
  await editor.value?.downloadAsJson()
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <button type="button" @click="previewJson">Preview as JSON</button>
      <button type="button" @click="downloadJson">Download JSON</button>
    </div>
    <div class="content">
      <div class="editor-wrap">
        <KritzelEditor
          ref="editor"
          editorId="import-export-workspace-export"
          theme="light"
          :themes="themes"
          :workspaces="workspaces"
          :isPanningEnabled="false"
          :isZoomingEnabled="false"
          :isMoreMenuVisible="false"
          :isWorkspaceManagerVisible="false"
        />
      </div>
      <aside class="info-panel">
        <h3>Exported Workspace</h3>
        <pre>{{ jsonPreview }}</pre>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
.content { flex: 1; display: flex; min-height: 0; }
.editor-wrap { flex: 1 1 60%; position: relative; min-width: 0; }
.editor-wrap > * { display: block; height: 100%; }
.info-panel { width: 300px; padding: 12px; overflow: auto; border-left: 1px solid #e0e0e0; box-sizing: border-box; }
.info-panel h3 { margin: 0 0 12px; font-size: 14px; }
pre { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; font-family: monospace; font-size: 11px; line-height: 1.45; }
</style>
