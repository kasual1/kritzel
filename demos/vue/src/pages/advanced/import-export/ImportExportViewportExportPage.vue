<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import Toolbar from '../../../components/Toolbar.vue'

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
    <Toolbar>
      <button type="button" @click="exportAsPng">Export as PNG</button>
      <button type="button" @click="exportAsSvg">Export as SVG</button>
    </Toolbar>
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
.editor-wrap { flex: 1; position: relative; min-height: 0; }
.editor-wrap > * { display: block; height: 100%; }
</style>
