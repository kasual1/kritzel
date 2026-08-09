<script setup lang="ts">
import { getEditorRef, KritzelEditor } from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle, seedEditor } from '../shared/concept-shared'

const editor = getEditorRef('editor');

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="components-editor-ui"
      theme="light"
      :themes="[vueThemeLight]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isWorkspaceManagerVisible="false"
      :isMoreMenuVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
