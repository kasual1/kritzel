<script setup lang="ts">
import { getEditorRef, KritzelEditor, type HTMLKritzelEditorElement } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { createSeedObjects } from '../../getting-started/seed-objects'

const editor = getEditorRef('editor')

async function onReady(): Promise<void> {
  const editorValue = editor.value as HTMLKritzelEditorElement | undefined
  if (!editorValue) {
    return
  }

  for (const obj of createSeedObjects()) {
    await editorValue.addObject(obj)
  }
}

async function exportAsPng(): Promise<void> {
  await (editor.value as HTMLKritzelEditorElement | undefined)?.exportViewportAsPng()
}

async function exportAsSvg(): Promise<void> {
  await (editor.value as HTMLKritzelEditorElement | undefined)?.exportViewportAsSvg()
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <span class="label">Viewport Export</span>
      <button @click="exportAsPng">Export as PNG</button>
      <button @click="exportAsSvg">Export as SVG</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="import-export-viewport-export"
      theme="light"
      :themes="[vueThemeLight, vueThemeDark]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      @isReady="onReady"
      style="flex: 1; min-height: 0"
    />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
.label { font-weight: 700; font-size: 13px; color: #42b883; margin-right: 4px; }
</style>
