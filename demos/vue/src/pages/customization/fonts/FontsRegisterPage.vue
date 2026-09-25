<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelText,
  KritzelWorkspace,
  type KritzelFontMap,
  type KritzelTheme,
} from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

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
  name: 'custom',
  global: {
    ...vueThemeLight.global,
    fontFamily: 'Pacifico',
  },
}]
const workspaces = [new KritzelWorkspace({
  id: 'fonts-register',
  name: 'Custom Fonts',
  objects: [new KritzelText({
    text: 'Handwritten Pacifico Font',
    translateX: -180,
    translateY: -50,
    fontSize: 24,
    fontFamily: 'Pacifico',
    fontColor: { light: '#42b883', dark: '#5ee0a8' },
  })],
})]

async function addPacificoText() {
  if (!editor.value) return

  const viewport = await editor.value.getViewport()
  const visibleWidth = viewport.width / viewport.scale
  const visibleHeight = viewport.height / viewport.scale
  const visibleLeft = -viewport.translateX / viewport.scale
  const visibleTop = -viewport.translateY / viewport.scale

  await editor.value.addObject(new KritzelText({
    text: 'Handwritten Pacifico Font',
    translateX: visibleLeft + visibleWidth * (0.2 + Math.random() * 0.6),
    translateY: visibleTop + visibleHeight * (0.2 + Math.random() * 0.6),
    fontSize: 24,
    fontFamily: 'Pacifico',
    fontColor: { light: '#42b883', dark: '#5ee0a8' },
  }))
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle()" @click="addPacificoText">Add Pacifico Text</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="fonts-register"
      :customFonts="fonts"
      :workspaces="workspaces"
      theme="custom"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="true"
      :style="editorStyle"
    />
  </div>
</template>
