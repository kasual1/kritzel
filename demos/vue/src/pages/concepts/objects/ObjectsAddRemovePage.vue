<script setup lang="ts">

import {
  getEditorRef,
  KritzelEditor,
  KritzelPath,
  KritzelShape,
  ShapeType,
  type KritzelBaseObject,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'
import { ref } from 'vue';

const editor = getEditorRef('editor');
const objects = ref<KritzelBaseObject<HTMLElement | SVGElement>[]>([])

async function refreshObjects() {
  const all = (await editor.value?.getAllObjects()) ?? []
  objects.value = all as KritzelBaseObject<HTMLElement | SVGElement>[]
}

function randomOffset() {
  return Math.floor(Math.random() * 200) - 100
}

async function addRectangle() {
  await editor.value?.addObject(
    new KritzelShape({
      translateX: randomOffset(),
      translateY: randomOffset(),
      width: 120,
      height: 80,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#e3f2fd', dark: '#1a237e' },
      strokeColor: { light: '#1565c0', dark: '#90caf9' },
      strokeWidth: 3,
    }),
  )
  await refreshObjects()
}

async function addEllipse() {
  await editor.value?.addObject(
    new KritzelShape({
      translateX: randomOffset(),
      translateY: randomOffset(),
      width: 100,
      height: 100,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#fce4ec', dark: '#880e4f' },
      strokeColor: { light: '#c62828', dark: '#ef9a9a' },
      strokeWidth: 3,
    }),
  )
  await refreshObjects()
}

async function addPath() {
  await editor.value?.addObject(
    new KritzelPath({
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
    }),
  )
  await refreshObjects()
}

async function removeLastObject() {
  const all = (await editor.value?.getAllObjects()) ?? []
  const last = all[all.length - 1]
  if (last) {
    await editor.value?.removeObject(last)
    await refreshObjects()
  }
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
    await refreshObjects()
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" @click="addRectangle">Add Rectangle</button>
      <button :style="buttonStyle(false)" @click="addEllipse">Add Ellipse</button>
      <button :style="buttonStyle(false)" @click="addPath">Add Path</button>
      <button :style="buttonStyle(false)" :disabled="objects.length === 0" @click="removeLastObject">Remove Last</button>
      <span :style="{ marginLeft: 'auto', fontSize: '13px' }">Objects: {{ objects.length }}</span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="objects-add-remove"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :wheelEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
