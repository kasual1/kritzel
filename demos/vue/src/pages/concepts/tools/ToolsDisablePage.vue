<script setup lang="ts">

import { KritzelEditor } from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
  getEditorRef,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const isDisabled = ref(true)

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  await editor.value.disable()
}

async function toggle() {
  if (!editor.value) {
    return
  }

  if (isDisabled.value) {
    await editor.value.enable()
    isDisabled.value = false
    return
  }

  await editor.value.disable()
  isDisabled.value = true
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="toggle">
        {{ isDisabled ? 'Enable' : 'Disable' }}
      </button>
      <span :style="{ fontSize: '13px', color: isDisabled ? '#e53935' : '#333' }">
        {{ isDisabled ? 'Interactions disabled' : 'Interactions enabled' }}
      </span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="tools-disable"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
