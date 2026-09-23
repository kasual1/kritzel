<script setup lang="ts">

import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelEraserTool,
  KritzelSelectionTool,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'
import {
  buttonStyle,
  editorStyle,
  hostStyle,
  seedEditor,
  toolbarStyle,
  getEditorRef,
} from '../../shared/demo-shared'
import { computed, ref } from 'vue'

const editor = getEditorRef('editor')
const isEraserDisabled = ref(true)

const toolbarItems = computed<KritzelToolbarItem[]>(() => {
  const eraserDisabled = isEraserDisabled.value

  return [
    {
      name: 'select',
      type: 'tool',
      isDefault: true,
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      icon: 'pen',
      config: {
        color: { light: '#1f2937', dark: '#f3f4f6' },
        size: 6,
        palette: [
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
          { light: '#42b883', dark: '#7ee2b8', label: 'Accent' },
        ],
      },
    },
    {
      name: 'eraser',
      type: 'tool',
      tool: KritzelEraserTool,
      icon: 'eraser',
      // Demonstrates the function form of `isDisabled` for dynamic, state-driven control.
      isDisabled: () => eraserDisabled,
    },
    {
      name: 'config',
      type: 'config',
    },
  ]
})

function toggle() {
  isEraserDisabled.value = !isEraserDisabled.value
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
      <button :style="buttonStyle(false)" @click="toggle">
        {{ isEraserDisabled ? 'Enable eraser tool' : 'Disable eraser tool' }}
      </button>
      <span :style="{ fontSize: '13px', color: isEraserDisabled ? '#e53935' : '#333' }">
        {{ isEraserDisabled ? 'Eraser tool disabled' : 'Eraser tool enabled' }}
      </span>
    </div>
    <KritzelEditor
      ref="editor"
      editorId="tools-toolbar-item-disable"
      theme="light"
      :themes="[vueThemeLight]"
      :toolbarItems="toolbarItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
