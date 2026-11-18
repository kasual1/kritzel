<script setup lang="ts">
import { getEditorRef, UpmadeEditor, UpmadeWorkspace } from '@upmade/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpmadeWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')

async function panToOrigin() {
  await editor.value?.panTo(0, 0)
}

async function panToOffset() {
  await editor.value?.panTo(200, 150)
}

async function setViewportCenter() {
  if (!editor.value) {
    return
  }

  const currentViewport = await editor.value.getViewport()
  await editor.value.setViewport(100, 100, currentViewport.scale)
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button @click="panToOrigin">Pan to Origin</button>
      <button @click="panToOffset">Pan to (200, 150)</button>
      <button @click="setViewportCenter">Center on (100, 100)</button>
    </Toolbar>
    <UpmadeEditor
      ref="editor"
      editorId="viewport-pan"
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