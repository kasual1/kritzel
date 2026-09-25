<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const panStep = 100
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')

async function panBy(offsetX: number, offsetY: number) {
  if (!editor.value) {
    return
  }

  const currentViewport = await editor.value.getViewport()
  const centerWorldX = (currentViewport.width / 2 - currentViewport.translateX) / currentViewport.scale
  const centerWorldY = (currentViewport.height / 2 - currentViewport.translateY) / currentViewport.scale
  await editor.value.setViewport(
    centerWorldX + offsetX,
    centerWorldY + offsetY,
    currentViewport.scale,
  )
}

async function panUp() {
  await panBy(0, -panStep)
}

async function panDown() {
  await panBy(0, panStep)
}

async function panLeft() {
  await panBy(-panStep, 0)
}

async function panRight() {
  await panBy(panStep, 0)
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="panUp">Pan Up</button>
      <button :style="buttonStyle(false)" @click="panDown">Pan Down</button>
      <button :style="buttonStyle(false)" @click="panLeft">Pan Left</button>
      <button :style="buttonStyle(false)" @click="panRight">Pan Right</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-boundaries"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :viewportBoundaryLeft="-500"
      :viewportBoundaryRight="500"
      :viewportBoundaryTop="-400"
      :viewportBoundaryBottom="400"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>