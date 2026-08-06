<script setup lang="ts">

import {
  KritzelEditor,
  type KritzelViewportState,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  statusBarStyle,
  toolbarStyle,
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const viewport = ref<KritzelViewportState | null>(null)

async function zoomIn() {
  const current = viewport.value?.scale ?? 1
  await editor.value?.zoomTo(Math.min(current * 1.5, 5))
}

async function zoomOut() {
  const current = viewport.value?.scale ?? 1
  await editor.value?.zoomTo(Math.max(current / 1.5, 0.1))
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}

function onViewportChange(event: CustomEvent<KritzelViewportState>) {
  viewport.value = event.detail
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="editor?.panTo(0, 0)">Pan to Origin</button>
      <button :style="buttonStyle(false)" @click="editor?.panTo(200, 150)">Pan to (200, 150)</button>
      <button :style="buttonStyle(false)" @click="zoomIn">Zoom In</button>
      <button :style="buttonStyle(false)" @click="zoomOut">Zoom Out</button>
      <button :style="buttonStyle(false)" @click="editor?.setViewport(100, 100, 0.5)">Set (100, 100, 0.5)</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-change"
      theme="vue-theme"
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
      @viewportChange="onViewportChange"
    />
    <div :style="{ ...statusBarStyle, fontFamily: 'monospace' }">
      <span>Zoom: {{ Math.round((viewport?.scale ?? 1) * 100) }}%</span>
      <span>X: {{ Math.round(viewport?.translateX ?? 0) }}</span>
      <span>Y: {{ Math.round(viewport?.translateY ?? 0) }}</span>
    </div>
  </div>
</template>
