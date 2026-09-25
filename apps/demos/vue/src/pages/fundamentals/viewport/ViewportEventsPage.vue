<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelViewportState,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const panStep = 100
const zoomFactor = 1.1
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')
const viewport = ref<KritzelViewportState | null>(null)

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

async function zoomIn() {
  await editor.value?.zoomIn(zoomFactor, 200)
}

async function zoomOut() {
  await editor.value?.zoomOut(zoomFactor, 200)
}

function onViewportChange(event: Event) {
  viewport.value = (event as CustomEvent<KritzelViewportState>).detail
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="panUp">Pan Up</button>
      <button :style="buttonStyle(false)" @click="panDown">Pan Down</button>
      <button :style="buttonStyle(false)" @click="panLeft">Pan Left</button>
      <button :style="buttonStyle(false)" @click="panRight">Pan Right</button>
      <button :style="buttonStyle(false)" @click="zoomIn">Zoom In</button>
      <button :style="buttonStyle(false)" @click="zoomOut">Zoom Out</button>
      <span>X: {{ Math.round(viewport?.translateX ?? 0) }}</span>
      <span>Y: {{ Math.round(viewport?.translateY ?? 0) }}</span>
      <span>Scale: {{ (viewport?.scale ?? 1).toFixed(2) }}</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-events"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @viewportChange="onViewportChange"
    />
  </div>
</template>