<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelPath,
  KritzelShape,
  KritzelWorkspace,
  ShapeType,
  type KritzelBaseObject,
} from '@kritzel/vue-editor'
import { ref } from 'vue'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { buttonStyle, editorStyle, hostStyle, toolbarStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const objects = ref<KritzelBaseObject[]>([])
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

function randomOffset() {
  return Math.floor(Math.random() * 200) - 100
}

async function refreshObjects() {
  objects.value = (await editor.value?.getAllObjects()) ?? []
}

async function addRectangle() {
  await editor.value?.addObject(new KritzelShape({
    translateX: randomOffset(),
    translateY: randomOffset(),
    width: 120,
    height: 80,
    shapeType: ShapeType.Rectangle,
    fillColor: { light: '#e3f2fd', dark: '#1a237e' },
    strokeColor: { light: '#1565c0', dark: '#90caf9' },
    strokeWidth: 3,
  }))
  await refreshObjects()
}

async function addEllipse() {
  await editor.value?.addObject(new KritzelShape({
    translateX: randomOffset(),
    translateY: randomOffset(),
    width: 100,
    height: 100,
    shapeType: ShapeType.Ellipse,
    fillColor: { light: '#fce4ec', dark: '#880e4f' },
    strokeColor: { light: '#c62828', dark: '#ef9a9a' },
    strokeWidth: 3,
  }))
  await refreshObjects()
}

async function addPath() {
  await editor.value?.addObject(new KritzelPath({
    points: [
      [0, 0, 0.5],
      [20, -15, 0.5],
      [40, -30, 0.5],
      [60, -20, 0.5],
      [80, -10, 0.5],
      [100, -25, 0.5],
      [120, -40, 0.5],
    ],
    translateX: randomOffset(),
    translateY: randomOffset(),
    strokeWidth: 6,
    fill: { light: '#ff9800', dark: '#ffb74d' },
  }))
  await refreshObjects()
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle()" @click="addRectangle">Add Rectangle</button>
      <button :style="buttonStyle()" @click="addEllipse">Add Ellipse</button>
      <button :style="buttonStyle()" @click="addPath">Add Path</button>
      <span class="object-count">Objects: {{ objects.length }}</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="objects-add"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="refreshObjects"
    />
  </div>
</template>

<style scoped>
.object-count {
  margin-left: auto;
  font-size: 13px;
}
</style>