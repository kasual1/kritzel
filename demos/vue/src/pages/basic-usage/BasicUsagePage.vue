<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  getEditorRef,
  InMemorySyncProvider,
  KritzelBaseObject,
  KritzelEditor,
  type KritzelSyncConfig,
  KritzelText,
} from 'kritzel-vue'
import { customVueTheme } from '../../const/custom-vue-theme'
import { createSeedObjects } from './seed-objects'

type ToolName = 'brush' | 'select'

const editor = getEditorRef('editor');
const isReady = ref(false)
const activeTool = ref<ToolName>('select')
const objectsCount = ref(0)

const syncConfig: KritzelSyncConfig = {
  providers: [InMemorySyncProvider],
}

const statusLine = computed(() => {
  if (!isReady.value) {
    return 'Loading editor...'
  }

  return `Objects: ${objectsCount.value} | Tool: ${activeTool.value}`
})

async function onReady() {
  if (!editor.value) {
    return
  }

  for (const obj of createSeedObjects()) {
    await editor.value.addObject(obj)
  }

  isReady.value = true
}

function onObjectsChange(
  event: CustomEvent<KritzelBaseObject<HTMLElement | SVGElement>[]>,
) {
  objectsCount.value = event.detail.length
}

async function setBrushTool() {
  if (!editor.value) {
    return
  }

  activeTool.value = 'brush'
  await editor.value.changeActiveToolByName('brush')
}

async function setSelectTool() {
  if (!editor.value) {
    return
  }

  activeTool.value = 'select'
  await editor.value.changeActiveToolByName('select')
}

async function addText() {
  if (!editor.value) {
    return
  }

  const text = new KritzelText({
    text: 'Programmatic text!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: { light: '#ff0000', dark: '#ff4d6d' },
  })

  await editor.value.addObject(text)
  await editor.value.selectObjects([text])
}

async function undoAction() {
  await editor.value?.undo()
}

async function zoomIn() {
  await editor.value?.zoomTo(1.5)
}
</script>

<template>
  <div class="basic-usage-page">
    <header class="toolbar">
      <button :class="{ active: activeTool === 'brush' }" @click="setBrushTool">
        Brush
      </button>
      <button :class="{ active: activeTool === 'select' }" @click="setSelectTool">
        Select
      </button>
      <button @click="addText">Add Text</button>
      <button @click="undoAction">Undo</button>
      <button @click="zoomIn">Zoom In</button>
      <span class="status">{{ statusLine }}</span>
    </header>

    <KritzelEditor
      ref="editor"
      editorId="basic-usage"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :syncConfig="syncConfig"
      :loginConfig="undefined"
      :wheelEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :isControlsVisible="false"
      @isReady="onReady"
      @objectsChange="onObjectsChange"
    />
  </div>
</template>

<style scoped>
.basic-usage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: Roboto, sans-serif;
  background: #fafafa;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-bottom: 1px solid #ebebeb;
  background: #f5f5f5;
}

button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #333333;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

button:hover {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

button.active {
  background: #42b883;
  color: #ffffff;
  border-color: #42b883;
}

.status {
  margin-left: auto;
  font-size: 12px;
  color: #555555;
  font-weight: 500;
  white-space: nowrap;
}

kritzel-editor {
  flex: 1;
  min-height: 0;
  display: block;
}
</style>
