<script setup lang="ts">
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

async function notify(type: 'info' | 'warning' | 'error') {
  await editor.value?.triggerNotification({
    type,
    message: `${type[0].toUpperCase()}${type.slice(1)} notification`,
  })
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="notify('info')">Show info</button>
      <button :style="buttonStyle(false)" @click="notify('warning')">Show warning</button>
      <button :style="buttonStyle(false)" @click="notify('error')">Show error</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="notifications-trigger"
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