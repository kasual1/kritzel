<script setup lang="ts">
import { getEditorRef, KritzelEditor } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')

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
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>