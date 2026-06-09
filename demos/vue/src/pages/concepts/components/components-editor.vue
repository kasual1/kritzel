<script setup lang="ts">
import { ref } from 'vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor } from '../shared/concept-shared'

const editor = ref<HTMLKritzelEditorElement | null>(null)

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <kritzel-editor
      ref="editor"
      editorId="components-editor"
      :wheelEnabled="false"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
