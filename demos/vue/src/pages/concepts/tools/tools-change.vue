<script setup lang="ts">
import { ref } from 'vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  statusBarStyle,
  toolbarStyle,
} from '../shared/concept-shared'

type ToolName = 'select' | 'brush' | 'eraser' | 'line' | 'shape' | 'text'

const tools: Array<{ name: ToolName; label: string }> = [
  { name: 'select', label: 'Select' },
  { name: 'brush', label: 'Brush' },
  { name: 'eraser', label: 'Eraser' },
  { name: 'line', label: 'Line' },
  { name: 'shape', label: 'Shape' },
  { name: 'text', label: 'Text' },
]

const editor = ref<HTMLKritzelEditorElement | null>(null)
const activeTool = ref<ToolName>('select')

async function setTool(name: ToolName) {
  activeTool.value = name
  await editor.value?.changeActiveToolByName(name)
}

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <div :style="toolbarStyle">
      <button
        v-for="tool in tools"
        :key="tool.name"
        :style="buttonStyle(activeTool === tool.name)"
        @click="setTool(tool.name)"
      >
        {{ tool.label }}
      </button>
    </div>
    <kritzel-editor
      ref="editor"
      editorId="tools-change"
      :wheelEnabled="false"
      theme="vue-theme"
      :themes="[customVueTheme]"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :isControlsVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
    <div :style="statusBarStyle">
      Active tool: <strong>{{ activeTool }}</strong>
    </div>
  </div>
</template>
