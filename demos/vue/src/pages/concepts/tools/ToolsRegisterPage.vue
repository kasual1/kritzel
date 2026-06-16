<script setup lang="ts">

import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  type KritzelBrushToolConfig,
  type KritzelToolbarControl,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'
import { editorStyle, hostStyle, seedEditor, getEditorRef } from '../shared/concept-shared'

const highlighterConfig: KritzelBrushToolConfig = {
  type: 'highlighter',
  color: { light: '#ffeb3b', dark: '#fff176' },
  size: 20,
  palettes: {
    highlighter: [
      { light: '#ffeb3b', dark: '#fff176', label: 'Yellow' },
      { light: '#76ff03', dark: '#b2ff59', label: 'Green' },
    ],
  },
}

const controls: KritzelToolbarControl[] = [
  {
    name: 'select',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
    isDefault: true,
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
  },
  {
    name: 'highlighter',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'highlighter',
    config: {
      type: 'highlighter',
      color: { light: '#ffeb3b', dark: '#fff176' },
      size: 20,
      opacity: 0.6,
      palettes: {
        highlighter: [
          { light: '#ffeb3b', dark: '#fff176', label: 'Yellow' },
          { light: '#76ff03', dark: '#b2ff59', label: 'Green' },
        ],
      },
    },
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
  if (!editor.value) {
    return
  }

  await seedEditor(editor.value)
  await editor.value.registerTool('highlighter', KritzelBrushTool, highlighterConfig)
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="tools-register"
      theme="vue-theme"
      :themes="[customVueTheme]"
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
