<script setup lang="ts">
import {
  UpmadeBrushTool,
  UpmadeEditor,
  UpmadeSelectionTool,
  UpmadeTextTool,
  UpmadeWorkspace,
  type UpmadeToolbarItem,
} from '@upmade/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new UpmadeWorkspace({ objects: createSeedObjects() })]

const toolbarItems: UpmadeToolbarItem[] = [
  {
    name: 'selection',
    type: 'tool',
    tool: UpmadeSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: UpmadeBrushTool,
    icon: 'pen',
    isDefault: true,
  },
  {
    name: 'text',
    type: 'tool',
    tool: UpmadeTextTool,
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
    <UpmadeEditor
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
