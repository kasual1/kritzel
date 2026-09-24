<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type ContextMenuItem,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'
import { editorStyle, hostStyle } from '../../shared/demo-shared'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const objectItems: ContextMenuItem[] = []

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste',
    icon: 'paste',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Select All',
    icon: 'selectAll',
    action: async () => {
      await editor.value?.selectAllObjectsInViewport()
    },
  },
]

async function onReady() {
  await editor.value?.openContextMenu({ x: -50, y: -50 })
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="custom-context-menu-canvas-quick-actions"
      theme="light"
      :themes="themes"
      :workspaces="workspaces"
      :globalContextMenuItems="globalItems"
      :objectContextMenuItems="objectItems"
      :isPanningEnabled="false"
      :isZoomingEnabled="false"
      :isMoreMenuVisible="false"
      :isWorkspaceManagerVisible="false"
      :style="editorStyle"
      @isReady="onReady"
    />
  </div>
</template>
