<script setup lang="ts">
import {
  UpdrawBrushTool,
  UpdrawEditor,
  UpdrawSelectionTool,
  UpdrawTextTool,
  UpdrawWorkspace,
  type UpdrawToolbarItem,
} from '@updraw/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpdrawWorkspace({ objects: createSeedObjects() })]

const toolbarItems: UpdrawToolbarItem[] = [
  {
    name: 'select',
    type: 'tool',
    tool: UpdrawSelectionTool,
    icon: 'cursor',
    isDefault: true,
  },
  {
    name: 'brush',
    type: 'tool',
    tool: UpdrawBrushTool,
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
    tool: UpdrawBrushTool,
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
    tool: UpdrawTextTool,
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
    <UpdrawEditor
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
