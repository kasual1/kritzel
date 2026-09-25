<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const zoomFactor = 1.1
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')

async function zoomIn() {
  await editor.value?.zoomIn(zoomFactor, 200)
}

async function zoomOut() {
  await editor.value?.zoomOut(zoomFactor, 200)
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="zoomIn">Zoom In</button>
      <button :style="buttonStyle(false)" @click="zoomOut">Zoom Out</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-limits"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :scaleMin="0.5"
      :scaleMax="2"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>