<script setup lang="ts">
import { ref } from 'vue'
import { getEditorRef, KritzelEditor, KritzelWorkspace } from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  statusBarStyle,
  toolbarStyle,
} from '../../shared/demo-shared'

type ToolName = 'select' | 'brush' | 'eraser' | 'line' | 'shape' | 'text'

const tools: Array<{ name: ToolName; label: string }> = [
  { name: 'select', label: 'Select' },
  { name: 'brush', label: 'Brush' },
  { name: 'eraser', label: 'Eraser' },
  { name: 'line', label: 'Line' },
  { name: 'shape', label: 'Shape' },
  { name: 'text', label: 'Text' },
]

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const editor = getEditorRef('editor')
const activeTool = ref<ToolName>('select')

async function setTool(name: ToolName) {
  activeTool.value = name
  await editor.value?.setActiveTool(name)
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
    <KritzelEditor
      ref="editor"
      editorId="tools-change"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :isToolbarVisible="false"
      :style="editorStyle"
    />
    <div :style="statusBarStyle">
      Active tool: <strong>{{ activeTool }}</strong>
    </div>
  </div>
</template>
