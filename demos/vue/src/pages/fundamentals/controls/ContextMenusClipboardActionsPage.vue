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

const globalItems: ContextMenuItem[] = [
  {
    label: 'Paste',
    icon: 'paste',
    group: 'clipboard',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Select All',
    icon: 'select-all',
    group: 'clipboard',
    action: async () => {
      await editor.value?.selectAllObjectsInViewport()
    },
  },
]

const objectItems: ContextMenuItem[] = [
  {
    label: 'Copy',
    icon: 'copy',
    group: 'clipboard',
    action: async () => {
      await editor.value?.copy()
    },
  },
  {
    label: 'Paste',
    icon: 'paste',
    group: 'clipboard',
    action: async (menu) => {
      await editor.value?.paste(menu.x, menu.y)
    },
  },
  {
    label: 'Delete',
    icon: 'delete',
    group: 'destructive',
    action: async () => {
      await editor.value?.delete()
    },
  },
]

async function onReady() {
  if (!editor.value) {
    return
  }

  await editor.value.selectAllObjectsInViewport()
  const selected = await editor.value.getSelectedObjects()
  if (!selected[0]) {
    return
  }

  await editor.value.openContextMenu({
    x: selected[0].translateX + 50,
    y: selected[0].translateY + 50,
  })
}
</script>

<template>
  <div :style="hostStyle">
    <KritzelEditor
      ref="editor"
      editorId="custom-context-menu-clipboard-actions"
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
