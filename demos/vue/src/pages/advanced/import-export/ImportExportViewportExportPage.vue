<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function exportAsPng(): Promise<void> {
  await editor.value?.exportViewportAsPng()
}

async function exportAsSvg(): Promise<void> {
  await editor.value?.exportViewportAsSvg()
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <button type="button" @click="exportAsPng">Export as PNG</button>
      <button type="button" @click="exportAsSvg">Export as SVG</button>
    </div>
    <div class="editor-wrap">
      <KritzelEditor
        ref="editor"
        editorId="import-export-viewport-export"
        theme="light"
        :themes="themes"
        :workspaces="workspaces"
        :isPanningEnabled="false"
        :isZoomingEnabled="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
      />
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
.editor-wrap { flex: 1; position: relative; min-height: 0; }
.editor-wrap > * { display: block; height: 100%; }
</style>
