<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function openDialog() {
  await editor.value?.openImportDialog()
}
</script>

<template>
  <div :style="hostStyle">
    <Toolbar>
      <button type="button" @click="openDialog">Open import dialog</button>
    </Toolbar>
    <KritzelEditor
      ref="editor"
      editorId="import-dialog"
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
    />
  </div>
</template>