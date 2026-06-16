<script setup lang="ts">
import { KritzelEditor } from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

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
      editorId="components-editor"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
