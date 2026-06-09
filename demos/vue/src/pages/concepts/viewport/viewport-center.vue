<script setup lang="ts">
import { ref } from 'vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
} from '../shared/concept-shared'

type ObjectItem = Parameters<HTMLKritzelEditorElement['centerObjects']>[0][number]

const editor = ref<HTMLKritzelEditorElement | null>(null)
const objects = ref<ObjectItem[]>([])

async function onReady() {
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  objects.value = ((await editor.value.getAllObjects()) ?? []) as ObjectItem[]
}

async function centerOn(index: number) {
  const target = objects.value[index]
  if (target) {
    await editor.value?.centerObjects([target] as unknown as Parameters<HTMLKritzelEditorElement['centerObjects']>[0])
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button :style="buttonStyle(false)" :disabled="objects.length < 2" @click="centerOn(1)">Center on Ellipsis</button>
      <button :style="buttonStyle(false)" :disabled="objects.length === 0" @click="centerOn(0)">Center on Rectangle</button>
      <button :style="buttonStyle(false)" :disabled="objects.length < 3" @click="centerOn(2)">Center on Line</button>
      <button :style="buttonStyle(false)" :disabled="objects.length < 4" @click="centerOn(3)">Center on Path</button>
      <button :style="buttonStyle(false)" @click="editor?.backToContent()">Back to Content</button>
    </div>
    <kritzel-editor
      ref="editor"
      editorId="viewport-center"
      :wheelEnabled="false"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
