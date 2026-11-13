<script setup lang="ts">
import {
  getEditorRef,
  UpdrawEditor,
  UpdrawText,
  UpdrawWorkspace,
  type UpdrawFontMap,
  type UpdrawTheme,
} from '@updraw/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle } from '../../shared/demo-shared'
import Toolbar from '../../../components/Toolbar.vue'

const editor = getEditorRef('editor')
const fonts: UpdrawFontMap = {
  pacifico: {
    family: 'Pacifico',
    label: 'Pacifico Cursive',
    cssFontFamily: "'Pacifico', cursive",
    source: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  },
}
const themes: UpdrawTheme[] = [{
  ...vueThemeLight,
  name: 'custom',
  global: {
    ...vueThemeLight.global,
    fontFamily: 'Pacifico',
  },
}]
const workspaces = [new UpdrawWorkspace({
  id: 'fonts-register',
  name: 'Custom Fonts',
  objects: [new UpdrawText({
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

  await editor.value.addObject(new UpdrawText({
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
    <Toolbar>
      <button @click="addPacificoText">Add Pacifico Text</button>
    </Toolbar>
    <UpdrawEditor
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
