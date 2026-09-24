<script setup lang="ts">
import {
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelTextTool,
  KritzelWorkspace,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]

const toolbarItems: KritzelToolbarItem[] = [
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
      color: { light: '#1f2937', dark: '#f3f4f6' },
      size: 6,
      palette: [
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#42b883', dark: '#7ee2b8', label: 'Vue Green' },
      ],
    },
  },
  {
    name: 'highlighter',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'highlighter',
    config: {
      color: { light: '#ffeb3b', dark: '#fff176' },
      size: 20,
      opacity: 0.6,
      palette: [
        { light: '#ffeb3b', dark: '#fff176', label: 'Yellow' },
        { light: '#76ff03', dark: '#b2ff59', label: 'Green' },
      ],
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
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      editorId="tools-register"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :toolbarItems="toolbarItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
    />
  </div>
</template>
