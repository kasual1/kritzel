<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

const editor = getEditorRef('editorComponent');

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editorComponent"
      editorId="components-editor-ui"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :wheelEnabled="false"
      :isWorkspaceManagerVisible="false"
      :isMoreMenuVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
