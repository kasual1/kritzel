<script setup lang="ts">

import {
  KritzelEditor,
  getEditorRef,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'
import { ref } from 'vue'

const editor = getEditorRef('editor');
const activeName = ref('light')

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeName === 'light')" @click="activeName = 'light'">Light</button>
      <button :style="buttonStyle(activeName === 'dark')" @click="activeName = 'dark'">Dark</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="theming-apply"
      :theme="activeName"
      :themes="[vueThemeLight, vueThemeDark]"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
