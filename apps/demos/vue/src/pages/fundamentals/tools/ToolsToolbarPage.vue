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
    name: 'selection',
    type: 'tool',
    tool: UpdrawSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: UpdrawBrushTool,
    icon: 'pen',
    isDefault: true,
  },
  {
    name: 'text',
    type: 'tool',
    tool: UpdrawTextTool,
    icon: 'type',
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
      editorId="tools-toolbar"
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
