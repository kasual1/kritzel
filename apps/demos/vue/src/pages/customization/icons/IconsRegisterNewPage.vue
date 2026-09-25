<script setup lang="ts">
import {
  getEditorRef,
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelWorkspace,
  type ContextMenuItem,
  type KritzelToolbarItem,
} from '@kritzel/vue-editor'
import type { KritzelSvgIconMap } from '@kritzel/editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const customSvgIcons: KritzelSvgIconMap = {
  alien: '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path fill="#42b883" d="M30 10h14v14h40V10h14v27h13v27H98v27H84v14H70V91H57v14H44V91H30V64H17V37h13zm14 41v13h13V51zm27 0v13h13V51z"/></svg>',
}
const globalContextMenuItems: ContextMenuItem[] = [
  { label: 'Alien icon', icon: 'alien', action: () => undefined },
]
const toolbarItems: KritzelToolbarItem[] = [
  { name: 'select', type: 'tool', tool: KritzelSelectionTool, icon: 'cursor', isDefault: true },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    config: {
      color: { light: '#42b883', dark: '#5ee0a8', label: 'Vue Green' },
      size: 8,
      opacity: 1,
      palette: [
        { light: '#42b883', dark: '#5ee0a8', label: 'Vue Green' },
        { light: '#1f2937', dark: '#f3f4f6', label: 'Ink' },
        { light: '#0284c7', dark: '#38bdf8', label: 'Sky' },
      ],
      sizes: [4, 8, 16],
    },
  },
  { name: 'alien', icon: 'alien', type: 'tool' },
]

function onReady() {
  editor.value?.openContextMenu({ x: -50, y: -50 })
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="icons-register-new"
      :customSvgIcons="customSvgIcons"
      :toolbarItems="toolbarItems"
      :workspaces="workspaces"
      :globalContextMenuItems="globalContextMenuItems"
      theme="light"
      :themes="themes"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>