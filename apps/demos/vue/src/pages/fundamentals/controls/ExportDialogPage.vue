<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function openDialog() {
  await editor.value?.openExportDialog()
}

async function closeDialog() {
  await editor.value?.closeExportDialog()
}

async function onReady() {
  await new Promise((resolve) => window.setTimeout(resolve, 100))
  await openDialog()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button type="button" :style="buttonStyle()" @click="openDialog">Open export dialog</button>
      <button type="button" :style="buttonStyle()" @click="closeDialog">Close export dialog</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="export-dialog"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isToolbarVisible="false"
      :isUtilityPanelVisible="false"
      :isWorkspaceManagerVisible="false"
      :isMoreMenuVisible="false"
      :isZoomPanelVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>