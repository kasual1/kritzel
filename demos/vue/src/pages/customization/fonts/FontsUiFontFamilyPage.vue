<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  type KritzelFontMap,
  type KritzelTheme,
} from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const fonts: KritzelFontMap = {
  pacifico: {
    family: 'Pacifico',
    label: 'Pacifico Cursive',
    cssFontFamily: "'Pacifico', cursive",
    source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
}
const themes: KritzelTheme[] = [{
  ...vueThemeLight,
  global: {
    ...vueThemeLight.global,
    fontFamily: "'Pacifico', cursive",
  },
}]

function onReady() {
  editor.value?.openSettingsDialog()
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="fonts-ui-font-family"
      :customFonts="fonts"
      theme="light"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>