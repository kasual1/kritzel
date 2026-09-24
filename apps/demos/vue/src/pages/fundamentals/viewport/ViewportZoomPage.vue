<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')

async function zoomIn() {
  await editor.value?.zoomIn()
}

async function zoomOut() {
  await editor.value?.zoomOut()
}

async function zoomToScale() {
  await editor.value?.zoomTo(1.5)
}

async function zoomToPoint() {
  await editor.value?.zoomTo(2, 200, 150)
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="zoomIn">Zoom In</button>
      <button :style="buttonStyle(false)" @click="zoomOut">Zoom Out</button>
      <button :style="buttonStyle(false)" @click="zoomToScale">Zoom to 150%</button>
      <button :style="buttonStyle(false)" @click="zoomToPoint">Zoom at (200, 150)</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-zoom"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>