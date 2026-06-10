<script setup lang="ts">

import {
  KritzelEditor,
  darkTheme,
  type KritzelTheme,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'
import { ref } from 'vue'

const themedDark: KritzelTheme = {
  ...darkTheme,
  name: 'vue-theme-dark',
}

const editor = ref<HTMLKritzelEditorElement | null>(null)
const activeName = ref('vue-theme')

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(activeName === 'vue-theme')" @click="activeName = 'vue-theme'">Light</button>
      <button :style="buttonStyle(activeName === 'vue-theme-dark')" @click="activeName = 'vue-theme-dark'">Dark</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="theming-apply"
      :theme="activeName"
      :themes="[customVueTheme, themedDark]"
      :wheelEnabled="false"
      :isMoreMenuVisible="true"
      :isWorkspaceManagerVisible="true"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
