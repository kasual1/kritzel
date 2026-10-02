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
    name: 'selection',
    type: 'tool',
    tool: KritzelSelectionTool,
    icon: 'cursor',
  },
  {
    name: 'brush',
    type: 'tool',
    tool: KritzelBrushTool,
    icon: 'pen',
    isDefault: true,
  },
  {
    name: 'text',
    type: 'tool',
    tool: KritzelTextTool,
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
    <KritzelEditor
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
