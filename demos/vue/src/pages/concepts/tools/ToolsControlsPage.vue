<script setup lang="ts">

import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  type KritzelToolbarControl,
} from 'kritzel-vue'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

const controls: KritzelToolbarControl[] = [
  {
    name: 'select',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      type: 'pen',
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 6,
      palettes: {
        pen: [
          { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
          { light: '#42b883', dark: '#7ee2b8', label: 'Accent' },
        ],
      },
    },
    isDefault: true,
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
    icon: 'type',
    config: {
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 18,
      fontFamily: 'Arial',
      palette: [
        { light: '#1f2937', dark: '#f3f4f6' },
        { light: '#42b883', dark: '#7ee2b8' },
      ],
    },
  },
  {
    name: 'config',
    type: 'config',
  },
]

const editor = getEditorRef('editor');

async function onReady() {
  if (editor.value) {
    await seedEditor(editor.value)
  }
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="tools-controls"
      theme="vue-theme"
      :themes="[vueThemeLight]"
      :controls="controls"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
