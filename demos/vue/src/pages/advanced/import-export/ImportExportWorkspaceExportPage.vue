<script setup lang="ts">
import { ref } from 'vue'
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import Toolbar from '../../../components/Toolbar.vue'
import InfoPanel from '../../../components/InfoPanel.vue'

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
    <Toolbar>
      <button type="button" @click="previewJson">Preview as JSON</button>
      <button type="button" @click="downloadJson">Download JSON</button>
    </Toolbar>
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
      <InfoPanel width="300px">
        <h3>Exported Workspace</h3>
        <pre>{{ jsonPreview }}</pre>
      </InfoPanel>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.content { flex: 1; display: flex; min-height: 0; }
.editor-wrap { flex: 1 1 60%; position: relative; min-width: 0; }
.editor-wrap > * { display: block; height: 100%; }
pre { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; font-family: monospace; font-size: 11px; line-height: 1.45; }
</style>
