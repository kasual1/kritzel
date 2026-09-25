<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelBaseObject,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const objects: KritzelBaseObject<HTMLElement | SVGElement>[] = createSeedObjects()
const workspaces = [new KritzelWorkspace({ objects })]
const editor = getEditorRef('editor')

async function centerOn(index: number) {
  const target = objects[index]
  if (target) {
    await editor.value?.centerObjects([target])
  }
}

async function backToContent() {
  await editor.value?.backToContent()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" :disabled="objects.length < 2" @click="centerOn(1)">Center on Ellipsis</button>
      <button :style="buttonStyle(false)" :disabled="objects.length === 0" @click="centerOn(0)">Center on Rectangle</button>
      <button :style="buttonStyle(false)" :disabled="objects.length < 3" @click="centerOn(2)">Center on Line</button>
      <button :style="buttonStyle(false)" :disabled="objects.length < 4" @click="centerOn(3)">Center on Path</button>
      <button :style="buttonStyle(false)" @click="backToContent">Back to Content</button>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="viewport-center"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
